import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { readFile } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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
const LINK_TTL_MS = 5 * 60 * 1000;
const LINK_MAX_MESSAGES = 5;
const LINK_CODE_REGEX = /^LF-\d{4}$/;
const SUPPRESS_REPLY_TTL_MS = 30_000;

export const verificationCodes = new Map<string, VerificationEntry>();

type PendingLink = {
  code: string;
  phone: string;
  expiresAt: number;
  messageCount: number;
  createdByRegister: boolean;
};

const pendingLinks = new Map<string, PendingLink>();
const suppressReply = new Map<string, number>();
const verifiedPhones = new Set<string>();

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

function hasMatchingIdentifier(userIdentifiers: string[], phone: string): boolean {
  const phoneIdentifiers = parseAllIdentifiers([phone]);
  return userIdentifiers.some((id) => {
    try {
      const parsed = parseAllIdentifiers([id]);
      return parsed.some((p) =>
        phoneIdentifiers.some((pi) => pi.channel === p.channel && pi.peerId === p.peerId),
      );
    } catch {
      return false;
    }
  });
}

function applyGeneratedConfigToOpenclaw(
  openclawJsonPath: string,
  generated: ReturnType<typeof generateConfig>,
): void {
  if (!existsSync(openclawJsonPath)) return;

  const ocRaw = JSON.parse(readFileSync(openclawJsonPath, "utf-8"));

  const previousManagedChannels = new Set<string>();
  const existingBindings = ocRaw.bindings as Array<{ match?: { channel?: string } }> | undefined;
  for (const binding of existingBindings ?? []) {
    const channel = binding?.match?.channel;
    if (channel) previousManagedChannels.add(channel);
  }

  ocRaw.agents = { ...ocRaw.agents, list: generated.agents.list };
  ocRaw.bindings = generated.bindings;
  ocRaw.session = { ...ocRaw.session, ...generated.session };

  if (!ocRaw.channels) ocRaw.channels = {};

  const newManagedChannels = new Set<string>(Object.keys(generated.channels ?? {}));
  const allManagedChannels = new Set<string>([...previousManagedChannels, ...newManagedChannels]);

  for (const channel of allManagedChannels) {
    const next = (generated.channels as Record<string, Record<string, unknown>>)[channel];
    if (next) {
      ocRaw.channels[channel] = { ...ocRaw.channels[channel], ...next };
      continue;
    }

    // Channel used to be managed by generated config but is no longer present.
    // Remove allow-list fields so stale access does not remain after unregister.
    if (!ocRaw.channels[channel]) continue;
    delete ocRaw.channels[channel].dmPolicy;
    delete ocRaw.channels[channel].allowFrom;
    if (ocRaw.channels[channel].dm && typeof ocRaw.channels[channel].dm === "object") {
      delete ocRaw.channels[channel].dm.policy;
      delete ocRaw.channels[channel].dm.allowFrom;
    }
  }

  if (generated.env) {
    ocRaw.env = { ...ocRaw.env, ...generated.env };
  }

  writeFileSync(openclawJsonPath, JSON.stringify(ocRaw, null, 2) + "\n");
}

function generateLinkCode(): string {
  return `LF-${String(randomInt(0, 10_000)).padStart(4, "0")}`;
}

function extractPhone(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const base = value.includes("@") ? value.split("@")[0] : value;
  const digits = base.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  return `+${digits}`;
}

function extractFirstPhone(...values: unknown[]): string | undefined {
  for (const value of values) {
    const phone = extractPhone(value);
    if (phone) return phone;
  }
  return undefined;
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
    const pendingLinksPath = join(multiUserDir, "pending-links.json");
    const openclawJsonPath = join(stateDir, "openclaw.json");

    const sendWA = api.runtime.channel.whatsapp.sendMessageWhatsApp as SendWhatsApp;

    const persistPendingLinks = () => {
      mkdirSync(multiUserDir, { recursive: true });
      const records = [...pendingLinks.values()];
      writeFileSync(pendingLinksPath, JSON.stringify({ pending: records }, null, 2) + "\n");
    };

    const upsertPendingLink = (entry: PendingLink) => {
      pendingLinks.set(entry.phone, entry);
      persistPendingLinks();
    };

    const removePendingLink = (phone: string) => {
      const removed = pendingLinks.delete(phone);
      if (removed) persistPendingLinks();
    };

    const clearSuppressReply = (phone: string) => {
      suppressReply.delete(phone);
    };

    const addSuppressReply = (phone: string) => {
      suppressReply.set(phone, Date.now() + SUPPRESS_REPLY_TTL_MS);
    };

    try {
      if (existsSync(pendingLinksPath)) {
        const raw = JSON.parse(readFileSync(pendingLinksPath, "utf-8")) as { pending?: PendingLink[] };
        for (const entry of raw.pending ?? []) {
          const phone = normalizePhone(entry.phone ?? "");
          if (!phone || !entry.code || !entry.expiresAt) continue;
          pendingLinks.set(phone, {
            code: String(entry.code).trim().toUpperCase(),
            phone,
            expiresAt: Number(entry.expiresAt),
            messageCount: Number(entry.messageCount ?? 0),
            createdByRegister: Boolean(entry.createdByRegister),
          });
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      api.logger.warn(`Failed to load pending links: ${errMsg}`);
    }

    const removeUserByPhone = (phone: string): { removed: boolean; removedUserIds: string[] } => {
      const usersConfig = loadUsersJson(usersJsonPath);
      const before = usersConfig.users.length;
      const removed = usersConfig.users.filter((u) => hasMatchingIdentifier(u.identifiers, phone));
      usersConfig.users = usersConfig.users.filter((u) => !hasMatchingIdentifier(u.identifiers, phone));

      if (before === usersConfig.users.length) {
        return { removed: false, removedUserIds: [] };
      }

      mkdirSync(multiUserDir, { recursive: true });
      writeFileSync(usersJsonPath, JSON.stringify(usersConfig, null, 2) + "\n");

      const generated = generateConfig(usersConfig);
      writeFileSync(generatedJsonPath, JSON.stringify(generated, null, 2) + "\n");
      applyGeneratedConfigToOpenclaw(openclawJsonPath, generated);
      return { removed: true, removedUserIds: removed.map((u) => u.id) };
    };

    const cleanupExpiredPendingLinks = () => {
      const now = Date.now();
      let changed = false;
      for (const [phone, pending] of pendingLinks.entries()) {
        if (now <= pending.expiresAt) continue;
        if (pending.createdByRegister) {
          try {
            removeUserByPhone(phone);
          } catch {
            // best-effort cleanup
          }
        }
        pendingLinks.delete(phone);
        changed = true;
        clearSuppressReply(phone);
        verifiedPhones.delete(phone);
      }

      for (const [phone, expiresAt] of suppressReply.entries()) {
        if (now <= expiresAt) continue;
        suppressReply.delete(phone);
      }

      if (changed) {
        persistPendingLinks();
      }
    };

    const cleanupTimer = setInterval(() => {
      try {
        cleanupExpiredPendingLinks();
      } catch {
        // best-effort background maintenance
      }
    }, 30_000);
    cleanupTimer.unref?.();

    const onEvent = (api as { on?: (name: string, handler: (event: any, ctx: any) => unknown) => void }).on;
    if (typeof onEvent === "function") {
      onEvent("message_received", async (event: any) => {
        if (pendingLinks.size === 0) return;
        const phone = extractPhone(
          event?.metadata?.senderE164
          ?? event?.metadata?.from
          ?? event?.origin?.from
          ?? event?.from
          ?? event?.sender
          ?? event?.senderPhone,
        );
        if (!phone) return;

        const pending = pendingLinks.get(phone);
        if (!pending) return;

        const now = Date.now();
        const content = String(
          event?.content
          ?? event?.message?.text
          ?? event?.message?.body
          ?? event?.text
          ?? "",
        ).trim().toUpperCase();

        if (content === pending.code || LINK_CODE_REGEX.test(content)) {
          if (content !== pending.code) {
            pending.messageCount += 1;
            if (pending.messageCount >= LINK_MAX_MESSAGES || now > pending.expiresAt) {
              if (pending.createdByRegister) {
                try {
                  removeUserByPhone(phone);
                } catch {
                  // best-effort cleanup
                }
              }
              removePendingLink(phone);
            }
            return { cancel: true };
          }

          verifiedPhones.add(phone);
          removePendingLink(phone);
          addSuppressReply(phone);

          await sendWhatsAppMessage(
            sendWA,
            phone,
            "Welcome to LogLife! Your WhatsApp is connected. Tip: send a quick voice note about your day to get started.",
          );
          return { cancel: true };
        }

        pending.messageCount += 1;
        if (pending.messageCount >= LINK_MAX_MESSAGES || now > pending.expiresAt) {
          if (pending.createdByRegister) {
            try {
              removeUserByPhone(phone);
            } catch {
              // best-effort cleanup
            }
          }
          removePendingLink(phone);
          return { cancel: true };
        }

        upsertPendingLink(pending);
        return { cancel: true };
      });

      onEvent("message_sending", (event: any) => {
        if (suppressReply.size === 0) return undefined;
        const now = Date.now();
        const phone = extractFirstPhone(
          event?.metadata?.recipientE164,
          event?.metadata?.to,
          event?.deliveryContext?.to,
          event?.origin?.to,
          event?.to,
          event?.recipient,
          event?.recipientPhone,
        );
        if (!phone) return undefined;
        const suppressUntil = suppressReply.get(phone);
        if (!suppressUntil) return undefined;
        if (now > suppressUntil) {
          suppressReply.delete(phone);
          return undefined;
        }
        suppressReply.delete(phone);
        return { cancel: true };
      });
    }

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
          const alreadyRegistered = usersConfig.users.some((u) =>
            hasMatchingIdentifier(u.identifiers, phone),
          );

          if (alreadyRegistered) {
            const linkCode = generateLinkCode();
            upsertPendingLink({
              code: linkCode,
              phone,
              expiresAt: Date.now() + LINK_TTL_MS,
              messageCount: 0,
              createdByRegister: false,
            });
            jsonResponse(res, 200, { registered: true, existing: true, linkCode });
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

          // We can't rely on $include because the gateway flattens it on hot-reload.
          applyGeneratedConfigToOpenclaw(openclawJsonPath, generated);

          const linkCode = generateLinkCode();
          upsertPendingLink({
            code: linkCode,
            phone,
            expiresAt: Date.now() + LINK_TTL_MS,
            messageCount: 0,
            createdByRegister: true,
          });

          api.logger.info(`Registered user "${userId}" (${phone})`);
          jsonResponse(res, 200, { registered: true, userId, linkCode });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          api.logger.error(`Registration failed for ${phone}: ${errMsg}`);
          jsonResponse(res, 500, { error: "Registration failed" });
        }
      },
    });

    // --- POST /loglife/unregister ---

    api.registerHttpRoute({
      path: "/loglife/unregister",
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

        const removeAll = body.all === true;
        const phoneRaw = body.phone as string | undefined;
        if (!removeAll && (!phoneRaw || typeof phoneRaw !== "string")) {
          jsonResponse(res, 400, { error: "Missing required field: phone (or pass all:true)" });
          return;
        }

        const phone = removeAll ? "" : normalizePhone(phoneRaw as string);
        if (!removeAll && phone.length < 8) {
          jsonResponse(res, 400, { error: "Invalid phone number" });
          return;
        }

        try {
          if (removeAll) {
            const usersConfig = loadUsersJson(usersJsonPath);
            const removedUserIds = usersConfig.users.map((u) => u.id);

            usersConfig.users = [];
            mkdirSync(multiUserDir, { recursive: true });
            writeFileSync(usersJsonPath, JSON.stringify(usersConfig, null, 2) + "\n");

            const generated = generateConfig(usersConfig);
            writeFileSync(generatedJsonPath, JSON.stringify(generated, null, 2) + "\n");
            applyGeneratedConfigToOpenclaw(openclawJsonPath, generated);

            pendingLinks.clear();
            persistPendingLinks();
            suppressReply.clear();
            verifiedPhones.clear();

            jsonResponse(res, 200, {
              removed: removedUserIds.length > 0,
              removedAll: true,
              removedUserIds,
            });
            return;
          }

          removePendingLink(phone);
          clearSuppressReply(phone);
          verifiedPhones.delete(phone);

          const result = removeUserByPhone(phone);
          if (!result.removed) {
            jsonResponse(res, 200, { removed: false, existing: false });
            return;
          }
          api.logger.info(`Unregistered ${result.removedUserIds.length} user(s) for phone ${phone}`);
          jsonResponse(res, 200, {
            removed: true,
            removedUserIds: result.removedUserIds,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          api.logger.error(`Unregister failed for ${phone}: ${errMsg}`);
          jsonResponse(res, 500, { error: "Unregister failed" });
        }
      },
    });

    // --- GET /loglife/verify/status ---

    api.registerHttpRoute({
      path: "/loglife/verify/status",
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
        const phoneRaw = url.searchParams.get("phone");
        if (!phoneRaw) {
          jsonResponse(res, 400, { error: "Missing required query: phone" });
          return;
        }

        const phone = normalizePhone(phoneRaw);
        cleanupExpiredPendingLinks();
        const verified = verifiedPhones.has(phone);
        const pending = pendingLinks.has(phone);
        const pendingEntry = pendingLinks.get(phone);
        const expired = pendingEntry ? Date.now() > pendingEntry.expiresAt : false;

        if (verified) {
          verifiedPhones.delete(phone);
        }

        jsonResponse(res, 200, { verified, pending, expired });
      },
    });

    // --- GET /loglife/users ---

    api.registerHttpRoute({
      path: "/loglife/users",
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "GET") {
          jsonResponse(res, 405, { error: "Method not allowed" });
          return;
        }

        if (!apiKey || !verifyApiKey(req, apiKey)) {
          jsonResponse(res, 401, { error: "Unauthorized" });
          return;
        }

        try {
          cleanupExpiredPendingLinks();
          const usersConfig = loadUsersJson(usersJsonPath);
          jsonResponse(res, 200, {
            count: usersConfig.users.length,
            users: usersConfig.users,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          api.logger.error(`Failed to read users list: ${errMsg}`);
          jsonResponse(res, 500, { error: "Failed to read users list" });
        }
      },
    });
  },
};

export default plugin;
