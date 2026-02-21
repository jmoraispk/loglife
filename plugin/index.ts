import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

type LogLifeConfig = {
  apiKey: string;
  agentId?: string;
};

function verifyApiKey(req: IncomingMessage, expectedKey: string): boolean {
  const auth = req.headers.authorization ?? "";
  const prefix = "Bearer ";
  if (!auth.startsWith(prefix)) return false;
  const token = auth.slice(prefix.length);
  if (token.length !== expectedKey.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expectedKey));
  } catch {
    return false;
  }
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

const plugin = {
  id: "loglife",
  name: "LogLife",
  description: "Exposes session data over HTTP for the LogLife dashboard",
  configSchema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["apiKey"],
    properties: {
      apiKey: { type: "string" as const },
      agentId: { type: "string" as const, default: "main" },
    },
  },

  register(api: OpenClawPluginApi) {
    const cfg = (api.pluginConfig ?? {}) as LogLifeConfig;
    const apiKey = cfg.apiKey;
    const agentId = cfg.agentId ?? "main";

    if (!apiKey) {
      api.logger.warn("LogLife plugin: apiKey not configured — HTTP route will reject all requests");
    }

    const stateDir = process.env.OPENCLAW_STATE_DIR
      ?? join(process.env.HOME ?? "/root", ".openclaw");
    const sessionsPath = join(stateDir, "agents", agentId, "sessions", "sessions.json");

    api.registerHttpRoute({
      path: "/loglife/sessions",
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "GET") {
          jsonResponse(res, 405, { error: "Method not allowed" });
          return;
        }

        if (!apiKey || !verifyApiKey(req, apiKey)) {
          jsonResponse(res, 401, { error: "Unauthorized" });
          return;
        }

        const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
        const sessionId = url.searchParams.get("sessionId");
        const key = url.searchParams.get("key");

        if (!sessionId && !key) {
          jsonResponse(res, 400, { error: "Provide ?sessionId= or ?key=" });
          return;
        }

        try {
          const raw = await readFile(sessionsPath, "utf-8");
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
            jsonResponse(res, 404, { error: "Session not found" });
            return;
          }

          const origin = session.origin as Record<string, string> | undefined;
          const delivery = session.deliveryContext as Record<string, string> | undefined;

          jsonResponse(res, 200, {
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
          jsonResponse(res, 500, { error: "Failed to read sessions" });
        }
      },
    });
  },
};

export default plugin;
