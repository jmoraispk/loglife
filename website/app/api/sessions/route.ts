import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const key = req.nextUrl.searchParams.get("key");

  if (!sessionId && !key) {
    return NextResponse.json({ error: "Provide ?sessionId= or ?key=" }, { status: 400 });
  }

  try {
    // const filePath = join(process.cwd(), "..", "sessions.json");
    const filePath = join("/home/ali/.openclaw/agents/main/sessions", "sessions.json");
    const raw = await readFile(filePath, "utf-8");
    const sessions: Record<string, Record<string, unknown>> = JSON.parse(raw);

    let session: Record<string, unknown> | undefined;
    let matchedKey = key || "";

    if (key) {
      session = sessions[key];
    } else if (sessionId) {
      for (const [k, v] of Object.entries(sessions)) {
        if (v.sessionId === sessionId) {
          session = v;
          matchedKey = k;
          break;
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const origin = session.origin as Record<string, string> | undefined;
    const delivery = session.deliveryContext as Record<string, string> | undefined;

    return NextResponse.json({
      sessionKey: matchedKey,
      sessionId: session.sessionId ?? "",
      updatedAt: session.updatedAt ?? 0,
      abortedLastRun: session.abortedLastRun ?? false,
      chatType: session.chatType ?? origin?.chatType ?? "unknown",
      lastChannel: session.lastChannel ?? delivery?.channel ?? "unknown",
      origin: {
        label: origin?.label ?? "Unknown",
        from: origin?.from ?? "",
        to: origin?.to ?? "",
      },
      deliveryContext: {
        channel: delivery?.channel ?? "unknown",
        to: delivery?.to ?? "",
      },
      compactionCount: session.compactionCount ?? 0,
      inputTokens: session.inputTokens ?? 0,
      outputTokens: session.outputTokens ?? 0,
      totalTokens: session.totalTokens ?? 0,
      model: session.model ?? "unknown",
    });
  } catch {
    return NextResponse.json({ error: "Failed to read sessions" }, { status: 500 });
  }
}
