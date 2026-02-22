import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENCLAW_API_URL || !OPENCLAW_API_KEY) {
    return NextResponse.json(
      { error: "Server not configured: missing OPENCLAW_API_URL or OPENCLAW_API_KEY" },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, phone, code } = body;

  if (!action || !phone) {
    return NextResponse.json({ error: "Missing required fields: action, phone" }, { status: 400 });
  }

  if (action === "send") {
    try {
      const response = await fetch(`${OPENCLAW_API_URL}/loglife/verify/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENCLAW_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json({ error: "Failed to reach OpenClaw server" }, { status: 502 });
    }
  }

  if (action === "check") {
    if (!code) {
      return NextResponse.json({ error: "Missing required field: code" }, { status: 400 });
    }

    try {
      const response = await fetch(`${OPENCLAW_API_URL}/loglife/verify/check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENCLAW_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (data.verified) {
        const normalized = "+" + phone.replace(/[^0-9]/g, "");
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        await client.users.updateUser(userId, {
          unsafeMetadata: { ...user.unsafeMetadata, whatsappPhone: normalized },
        });
      }

      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json({ error: "Failed to reach OpenClaw server" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Invalid action. Use 'send' or 'check'" }, { status: 400 });
}
