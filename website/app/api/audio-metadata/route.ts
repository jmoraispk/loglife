import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

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
    const response = await fetch(`${OPENCLAW_API_URL}/loglife/audio-metadata?${params}`, {
      headers: { Authorization: `Bearer ${OPENCLAW_API_KEY}` },
    });

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
