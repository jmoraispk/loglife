import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

export async function GET(req: NextRequest) {
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

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing required query: phone" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${OPENCLAW_API_URL}/loglife/verify/status?phone=${encodeURIComponent(phone)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${OPENCLAW_API_KEY}`,
        },
      },
    );

    const data = response.ok ? await response.json() : { error: await response.text() };
    if (response.ok && data.verified) {
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
