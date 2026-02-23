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

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone } = body;
  if (!phone) {
    return NextResponse.json({ error: "Missing required field: phone" }, { status: 400 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;

  try {
    const response = await fetch(`${OPENCLAW_API_URL}/loglife/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENCLAW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, name }),
    });

    const data = response.ok ? await response.json() : { error: await response.text() };
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach OpenClaw server" }, { status: 502 });
  }
}
