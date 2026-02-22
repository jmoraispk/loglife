import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { timingSafeEqual, randomInt } from "node:crypto";
import { URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { WebSocket } from "ws";

type LogLifeConfig = {
  apiKey: string;
  agentId?: string;
};

type VerificationEntry = {
  code: string;
  expiresAt: number;
  sentAt: number;
};

const VERIFY_TTL_MS = 5 * 60 * 1000;
const VERIFY_COOLDOWN_MS = 60 * 1000;

const verificationCodes = new Map<string, VerificationEntry>();

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return "+" + digits;
}

export function verifyApiKey(req: IncomingMessage, expectedKey: string): boolean {
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

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendViaGateway(
  port: number,
  authToken: string | undefined,
  to: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const url = `ws://127.0.0.1:${port}`;
    const ws = new WebSocket(url);
    const reqId = crypto.randomUUID();
    const timeout = setTimeout(() => {
      ws.close();
      resolve({ ok: false, error: "Gateway timeout" });
    }, 10_000);

    ws.on("open", () => {
      if (authToken) {
        ws.send(JSON.stringify({
          type: "req",
          id: crypto.randomUUID(),
          method: "auth",
          params: { token: authToken },
        }));
      }

      ws.send(JSON.stringify({
        type: "req",
        id: reqId,
        method: "send",
        params: {
          to,
          message,
          channel: "whatsapp",
          idempotencyKey: crypto.randomUUID(),
        },
      }));
    });

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === reqId && msg.type === "res") {
          clearTimeout(timeout);
          ws.close();
          resolve({ ok: !!msg.ok, error: msg.error?.message });
        }
      } catch { /* ignore non-JSON frames */ }
    });

    ws.on("error", () => {
      clearTimeout(timeout);
      resolve({ ok: false, error: "Gateway connection failed" });
    });
  });
}

const plugin = {
  id: "loglife",
  name: "LogLife",
  description: "Exposes session data over HTTP for the LogLife dashboard",
  configSchema: {
    type: "object" as const,
    additionalProperties: false,
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
      api.logger.warn("LogLife plugin: apiKey not configured — HTTP routes will reject all requests");
    }

    const stateDir = process.env.OPENCLAW_STATE_DIR
      ?? join(process.env.HOME ?? "/root", ".openclaw");
    const sessionsPath = join(stateDir, "agents", agentId, "sessions", "sessions.json");

    const gatewayPort = (api.config as Record<string, unknown>)?.gateway
      ? ((api.config as Record<string, Record<string, unknown>>).gateway.port as number) ?? 18789
      : 18789;
    const gatewayAuth = (api.config as Record<string, unknown>)?.gateway
      ? ((api.config as Record<string, Record<string, unknown>>).gateway.auth as Record<string, unknown>)
      : undefined;
    const gatewayToken = gatewayAuth?.token as string | undefined;

    // --- GET /loglife/sessions ---

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
        const phone = url.searchParams.get("phone");

        if (!sessionId && !key && !phone) {
          jsonResponse(res, 400, { error: "Provide ?sessionId=, ?key=, or ?phone=" });
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
          } else if (phone) {
            const normalized = normalizePhone(phone);
            for (const [k, v] of Object.entries(sessions)) {
              const origin = v.origin as Record<string, string> | undefined;
              const from = origin?.from ?? "";
              if (normalizePhone(from) === normalized) {
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

    // --- POST /loglife/verify/send ---

    api.registerHttpRoute({
      path: "/loglife/verify/send",
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          jsonResponse(res, 405, { error: "Method not allowed" });
          return;
        }

        if (!apiKey || !verifyApiKey(req, apiKey)) {
          jsonResponse(res, 401, { error: "Unauthorized" });
          return;
        }

        let body: Record<string, unknown>;
        try {
          body = await readBody(req);
        } catch {
          jsonResponse(res, 400, { error: "Invalid JSON body" });
          return;
        }

        const phoneRaw = body.phone as string | undefined;
        if (!phoneRaw || typeof phoneRaw !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: phone" });
          return;
        }

        const phone = normalizePhone(phoneRaw);
        if (phone.length < 8) {
          jsonResponse(res, 400, { error: "Invalid phone number" });
          return;
        }

        const existing = verificationCodes.get(phone);
        if (existing && Date.now() - existing.sentAt < VERIFY_COOLDOWN_MS) {
          const retryIn = Math.ceil((VERIFY_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
          jsonResponse(res, 429, { error: `Too many requests. Try again in ${retryIn}s` });
          return;
        }

        const code = String(randomInt(100_000, 999_999));
        verificationCodes.set(phone, {
          code,
          expiresAt: Date.now() + VERIFY_TTL_MS,
          sentAt: Date.now(),
        });

        const message = `Your LogLife verification code is: ${code}`;
        const result = await sendViaGateway(gatewayPort, gatewayToken, phone, message);

        if (!result.ok) {
          verificationCodes.delete(phone);
          jsonResponse(res, 502, { error: result.error ?? "Failed to send message" });
          return;
        }

        jsonResponse(res, 200, { sent: true });
      },
    });

    // --- POST /loglife/verify/check ---

    api.registerHttpRoute({
      path: "/loglife/verify/check",
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          jsonResponse(res, 405, { error: "Method not allowed" });
          return;
        }

        if (!apiKey || !verifyApiKey(req, apiKey)) {
          jsonResponse(res, 401, { error: "Unauthorized" });
          return;
        }

        let body: Record<string, unknown>;
        try {
          body = await readBody(req);
        } catch {
          jsonResponse(res, 400, { error: "Invalid JSON body" });
          return;
        }

        const phoneRaw = body.phone as string | undefined;
        const codeInput = body.code as string | undefined;

        if (!phoneRaw || typeof phoneRaw !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: phone" });
          return;
        }
        if (!codeInput || typeof codeInput !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: code" });
          return;
        }

        const phone = normalizePhone(phoneRaw);
        const entry = verificationCodes.get(phone);

        if (!entry || Date.now() > entry.expiresAt) {
          verificationCodes.delete(phone);
          jsonResponse(res, 200, { verified: false, error: "Code expired or not found" });
          return;
        }

        if (!safeCompare(entry.code, codeInput.trim())) {
          jsonResponse(res, 200, { verified: false, error: "Invalid code" });
          return;
        }

        verificationCodes.delete(phone);
        jsonResponse(res, 200, { verified: true });
      },
    });
  },
};

export default plugin;
