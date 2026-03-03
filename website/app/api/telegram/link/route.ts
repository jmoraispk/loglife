import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const LINK_TTL_MS = 10 * 60 * 1000;

type LinkMeta = {
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: "create" | "complete"; token?: string; chatId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  if (!action) {
    return NextResponse.json({ error: "Missing required field: action" }, { status: 400 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const unsafe = (user.unsafeMetadata ?? {}) as Record<string, unknown>;

  if (action === "create") {
    if (!TELEGRAM_BOT_USERNAME) {
      return NextResponse.json(
        { error: "Server not configured: missing TELEGRAM_BOT_USERNAME" },
        { status: 503 },
      );
    }

    const token = randomBytes(24).toString("base64url");
    const now = Date.now();
    const linkMeta: LinkMeta = {
      tokenHash: hashToken(token),
      createdAt: now,
      expiresAt: now + LINK_TTL_MS,
    };

    await client.users.updateUser(userId, {
      unsafeMetadata: {
        ...unsafe,
        telegramPendingLink: linkMeta,
      },
    });

    const startPayload = `ll_${token}`;
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(startPayload)}`;
    const webDeepLink = `https://web.telegram.org/a/#@${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(startPayload)}`;

    return NextResponse.json({
      ok: true,
      deepLink,
      webDeepLink,
      token,
      expiresInSec: Math.floor(LINK_TTL_MS / 1000),
      note: "Open the link and press Start in Telegram, then complete linking from dashboard.",
    });
  }

  if (action === "complete") {
    if (!OPENCLAW_API_URL || !OPENCLAW_API_KEY) {
      return NextResponse.json(
        { error: "Server not configured: missing OPENCLAW_API_URL or OPENCLAW_API_KEY" },
        { status: 503 },
      );
    }

    const token = body.token?.trim();
    let chatId = body.chatId?.trim() || "";
    if (!token) {
      return NextResponse.json({ error: "Missing required field: token" }, { status: 400 });
    }

    const pending = unsafe.telegramPendingLink as LinkMeta | undefined;
    if (!pending?.tokenHash || !pending.expiresAt) {
      return NextResponse.json({ error: "No pending Telegram link request. Create one first." }, { status: 400 });
    }

    if (Date.now() > pending.expiresAt) {
      return NextResponse.json({ error: "Link token expired. Create a new link." }, { status: 400 });
    }

    const providedHash = hashToken(token);
    if (!safeEqualHex(pending.tokenHash, providedHash)) {
      return NextResponse.json({ error: "Invalid link token." }, { status: 400 });
    }

    if (!chatId) {
      try {
        const resolveResponse = await fetch(`${OPENCLAW_API_URL}/loglife/telegram/link/resolve`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENCLAW_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (resolveResponse.ok) {
          const resolved = await resolveResponse.json();
          chatId = String(resolved.chatId ?? "").trim();
        } else if (resolveResponse.status === 404) {
          return NextResponse.json(
            { pending: true, error: "Telegram start not detected yet. Press Start in bot and try again." },
            { status: 409 },
          );
        } else {
          const resolveError = await resolveResponse.text();
          return NextResponse.json(
            { error: `Failed to resolve Telegram chat: ${resolveError || "Unknown error"}` },
            { status: 502 },
          );
        }
      } catch {
        return NextResponse.json({ error: "Failed to reach OpenClaw server" }, { status: 502 });
      }
    }

    if (!chatId) {
      return NextResponse.json({ error: "Unable to resolve Telegram chatId from token." }, { status: 400 });
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
    let registerOk = true;
    let registerError = "";
    try {
      const response = await fetch(`${OPENCLAW_API_URL}/loglife/telegram/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENCLAW_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: chatId, name }),
      });

      if (!response.ok) {
        registerOk = false;
        registerError = await response.text();
      }
    } catch {
      registerOk = false;
      registerError = "Failed to reach OpenClaw server";
    }

    if (!registerOk) {
      return NextResponse.json(
        { error: `Telegram register failed: ${registerError || "Unknown error"}` },
        { status: 502 },
      );
    }

    await client.users.updateUser(userId, {
      unsafeMetadata: {
        ...unsafe,
        telegramChatId: chatId,
        telegramPendingLink: null,
      },
    });

    return NextResponse.json({ linked: true, chatId });
  }

  return NextResponse.json({ error: "Invalid action. Use 'create' or 'complete'" }, { status: 400 });
}
