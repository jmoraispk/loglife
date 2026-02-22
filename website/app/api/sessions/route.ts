import { NextRequest, NextResponse } from "next/server";

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

export async function GET(req: NextRequest) {
  if (!OPENCLAW_API_URL || !OPENCLAW_API_KEY) {
    return NextResponse.json(
      { error: "Server not configured: missing OPENCLAW_API_URL or OPENCLAW_API_KEY" },
      { status: 503 },
    );
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const key = req.nextUrl.searchParams.get("key");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!sessionId && !key && !phone) {
    return NextResponse.json({ error: "Provide ?sessionId=, ?key=, or ?phone=" }, { status: 400 });
  }

  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  if (key) params.set("key", key);
  if (phone) params.set("phone", phone);

  try {
    const response = await fetch(`${OPENCLAW_API_URL}/loglife/sessions?${params}`, {
      headers: { Authorization: `Bearer ${OPENCLAW_API_KEY}` },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach OpenClaw server" }, { status: 502 });
  }
}
