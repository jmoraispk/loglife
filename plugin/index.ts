import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { readFile } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync, existsSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual, randomInt, createHash } from "node:crypto";
import { URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { generateConfig, validateUsersConfig } from "./multi-user/generate.js";
import type { UsersConfig, UserProfile } from "./multi-user/types.js";
import { parseAllIdentifiers } from "./multi-user/identifiers.js";

type LogLifeConfig = {
  apiKey: string;
  agentId?: string;
  multiUserDir?: string;
};

export type VerificationEntry = {
  code: string;
  expiresAt: number;
  sentAt: number;
};

const VERIFY_TTL_MS = 5 * 60 * 1000;
const VERIFY_COOLDOWN_MS = 60 * 1000;

export const verificationCodes = new Map<string, VerificationEntry>();

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

type SendWhatsApp = (
  to: string,
  body: string,
  options: { verbose: boolean },
) => Promise<{ messageId: string; toJid: string }>;

async function sendWhatsAppMessage(
  sendFn: SendWhatsApp,
  to: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await sendFn(to, message, { verbose: false });
    return { ok: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: errMsg };
  }
}

function loadUsersJson(usersJsonPath: string): UsersConfig {
  if (!existsSync(usersJsonPath)) {
    return { users: [], defaults: { dmScope: "main" } };
  }
  const raw = JSON.parse(readFileSync(usersJsonPath, "utf-8"));
  return validateUsersConfig(raw);
}

function deriveUserId(phone: string, name: string | undefined, config: UsersConfig): string {
  const existingIds = new Set(config.users.map((u) => u.id));

  if (name) {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    if (base && !existingIds.has(base)) return base;
    // Append short hash if name collides
    const hash = createHash("sha256").update(phone).digest("hex").slice(0, 6);
    const candidate = `${base}-${hash}`;
    if (!existingIds.has(candidate)) return candidate;
  }

  // Fall back to phone-based hash
  const hash = createHash("sha256").update(phone).digest("hex").slice(0, 12);
  return `user-${hash}`;
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
      multiUserDir: { type: "string" as const },
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
    const multiUserDir = cfg.multiUserDir ?? join(stateDir, "multi-user");
    const usersJsonPath = join(multiUserDir, "users.json");
    const generatedJsonPath = join(multiUserDir, "generated.json");
    const openclawJsonPath = join(stateDir, "openclaw.json");

    const sendWA = api.runtime.channel.whatsapp.sendMessageWhatsApp as SendWhatsApp;

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
        const result = await sendWhatsAppMessage(sendWA, phone, message);

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

        sendWhatsAppMessage(
          sendWA,
          phone,
          "Welcome to LogLife! Your dashboard is now connected. Send me a message anytime to start journaling.",
        ).catch(() => { /* best-effort */ });
      },
    });

    // --- POST /loglife/register ---

    api.registerHttpRoute({
      path: "/loglife/register",
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

        const name = (body.name as string | undefined)?.trim() || undefined;
        const model = (body.model as string | undefined)?.trim() || undefined;

        try {
          const usersConfig = loadUsersJson(usersJsonPath);

          // Idempotent: check if phone is already registered
          const phoneIdentifiers = parseAllIdentifiers([phone]);
          const alreadyRegistered = usersConfig.users.some((u) =>
            u.identifiers.some((id) => {
              try {
                const parsed = parseAllIdentifiers([id]);
                return parsed.some((p) =>
                  phoneIdentifiers.some((pi) => pi.channel === p.channel && pi.peerId === p.peerId),
                );
              } catch {
                return false;
              }
            }),
          );

          if (alreadyRegistered) {
            jsonResponse(res, 200, { registered: true, existing: true });
            return;
          }

          const userId = deriveUserId(phone, name, usersConfig);
          const newUser: UserProfile = {
            id: userId,
            identifiers: [phone],
          };
          if (name) newUser.name = name;
          if (model) newUser.model = model;

          usersConfig.users.push(newUser);

          mkdirSync(multiUserDir, { recursive: true });
          writeFileSync(usersJsonPath, JSON.stringify(usersConfig, null, 2) + "\n");

          const generated = generateConfig(usersConfig);
          writeFileSync(generatedJsonPath, JSON.stringify(generated, null, 2) + "\n");

          if (existsSync(openclawJsonPath)) {
            const now = new Date();
            utimesSync(openclawJsonPath, now, now);
          }

          api.logger.info(`Registered user "${userId}" (${phone})`);
          jsonResponse(res, 200, { registered: true, userId });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          api.logger.error(`Registration failed for ${phone}: ${errMsg}`);
          jsonResponse(res, 500, { error: "Registration failed" });
        }
      },
    });
  },
};

export default plugin;
