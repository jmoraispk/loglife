import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

type OpenClawUser = {
  id?: string;
  identifiers?: string[];
};

function toDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function identifierMatchesPhone(identifier: string, phoneDigits: string): boolean {
  const trimmed = identifier.trim();
  if (!trimmed) return false;
  const payload = trimmed.includes(":") ? trimmed.slice(trimmed.indexOf(":") + 1) : trimmed;
  const base = payload.split("@")[0] ?? payload;
  const digits = toDigits(base);
  return digits.length > 0 && digits === phoneDigits;
}

async function tryResolveUserIdByPhone(phone: string): Promise<string | null> {
  const phoneDigits = toDigits(phone);
  if (!phoneDigits) return null;

  const usersResponse = await fetch(`${OPENCLAW_API_URL}/loglife/users`, {
    headers: { Authorization: `Bearer ${OPENCLAW_API_KEY}` },
  });
  if (!usersResponse.ok) return null;

  const usersData = (await usersResponse.json()) as { users?: OpenClawUser[] };
  const users = Array.isArray(usersData.users) ? usersData.users : [];
  const matched = users.find((user) =>
    Array.isArray(user.identifiers) &&
    user.identifiers.some((identifier) => identifierMatchesPhone(identifier, phoneDigits)),
  );
  return matched?.id ?? null;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!OPENCLAW_API_URL || !OPENCLAW_API_KEY) {
    return NextResponse.json(
      { error: "Server not configured: missing OPENCLAW_API_URL or OPENCLAW_API_KEY" },
      { status: 503 },
    );
  }

  const phone = req.nextUrl.searchParams.get("phone");
  const userIdParam = req.nextUrl.searchParams.get("userId");

  if (!phone && !userIdParam) {
    return NextResponse.json({ error: "Provide ?phone= or ?userId=" }, { status: 400 });
  }

  const params = new URLSearchParams();
  if (phone) params.set("phone", phone);
  if (userIdParam) params.set("userId", userIdParam);

  try {
    let response = await fetch(`${OPENCLAW_API_URL}/loglife/audio-metadata?${params}`, {
      headers: { Authorization: `Bearer ${OPENCLAW_API_KEY}` },
    });

    // Fallback for identifiers that don't match strict phone parsing in upstream.
    if (response.status === 404 && phone) {
      const resolvedUserId = await tryResolveUserIdByPhone(phone);
      if (resolvedUserId) {
        const fallbackParams = new URLSearchParams();
        fallbackParams.set("userId", resolvedUserId);
        response = await fetch(`${OPENCLAW_API_URL}/loglife/audio-metadata?${fallbackParams}`, {
          headers: { Authorization: `Bearer ${OPENCLAW_API_KEY}` },
        });
      }
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      const bodyPreview = (await response.text()).slice(0, 200);
      return NextResponse.json(
        {
          error: "OpenClaw returned non-JSON response for /loglife/audio-metadata",
          upstreamStatus: response.status,
          upstreamContentType: contentType || null,
          upstreamBodyPreview: bodyPreview || null,
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach OpenClaw server" }, { status: 502 });
  }
}
