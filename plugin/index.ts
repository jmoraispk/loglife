import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { readFile, readdir } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync, existsSync, utimesSync, rmSync } from "node:fs";
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
const LINK_WELCOME_TEXT = "Welcome to LogLife! Your WhatsApp is connected. Tip: Send a quick voice note about why you're trying LogLife to get started.";

export const verificationCodes = new Map<string, VerificationEntry>();
export const telegramVerificationCodes = new Map<string, VerificationEntry>();

type PendingLink = {
  code: string;
  phone: string;
  expiresAt: number;
  messageCount: number;
  createdByRegister: boolean;
};

const pendingLinks = new Map<string, PendingLink>();
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

type SendTelegram = (
  to: string,
  body: string,
  options?: { verbose: boolean },
) => Promise<unknown>;

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

async function sendTelegramMessage(
  sendFn: SendTelegram | undefined,
  to: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!sendFn) {
    return { ok: false, error: "Telegram channel is not configured on OpenClaw" };
  }

  try {
    await sendFn(to, message, { verbose: false });
    return { ok: true };
  } catch {
    // Fallback for runtimes that do not accept options.
    try {
      await sendFn(to, message);
      return { ok: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errMsg };
    }
  }
}

function normalizeTelegramPeer(raw: string): string {
  const value = raw.trim().replace(/^telegram:/i, "").replace(/^@/, "");
  return value;
}

function toTelegramIdentifier(raw: string): string {
  return `telegram:${normalizeTelegramPeer(raw)}`;
}

function extractTelegramChatId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const prefixed = trimmed.match(/^telegram:([A-Za-z0-9_+-]+)$/i);
  if (prefixed) return prefixed[1];

  const directKey = trimmed.match(/:direct:([A-Za-z0-9_+-]+)$/i);
  if (directKey) return directKey[1];

  if (/^-?\d+$/.test(trimmed)) return trimmed;
  return null;
}

function sessionLikelyTelegram(session: Record<string, unknown>): boolean {
  const delivery = session.deliveryContext as Record<string, unknown> | undefined;
  const origin = session.origin as Record<string, unknown> | undefined;
  const values = [
    session.lastChannel,
    session.lastTo,
    delivery?.channel,
    delivery?.to,
    origin?.provider,
    origin?.surface,
    origin?.from,
    origin?.to,
  ];
  return values.some((v) => typeof v === "string" && v.toLowerCase().includes("telegram"));
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

  const existingAgentList = Array.isArray(ocRaw.agents?.list)
    ? (ocRaw.agents.list as Array<Record<string, unknown>>)
    : [];
  const preservedMainAgent = existingAgentList.find((agent) => agent?.id === "main");
  const ensuredMainAgent = preservedMainAgent ?? { id: "main", name: "Main" };
  const generatedAgentsWithoutMain = generated.agents.list.filter((agent) => agent.id !== "main");
  const mergedAgentList = [ensuredMainAgent, ...generatedAgentsWithoutMain];

  ocRaw.agents = { ...ocRaw.agents, list: mergedAgentList };
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

const AUDIO_METADATA_RULE_BEGIN = "<!-- LOGLIFE_AUDIO_METADATA_RULE:BEGIN -->";
const AUDIO_METADATA_RULE_END = "<!-- LOGLIFE_AUDIO_METADATA_RULE:END -->";
const AUDIO_METADATA_RULE_BLOCK = `${AUDIO_METADATA_RULE_BEGIN}
# Rule: Save inbound audio metadata

When the agent receives any inbound audio/voice message, do the following automatically:

1. Create the audio_metadata folder in the user workspace if not already exist
2. Save a JSON file named <message_id>.json in that folder containing these fields only:

{
  "source_path": "<absolute path to local media file>",
  "transcription": "<best-effort transcript or empty string>",
  "duration_seconds": <integer seconds read from the audio file metadata or null>,
  "format": "<human readable format string (e.g., 'Ogg Opus, mono, 48000 Hz') or null>",
  "size_bytes": <integer or null>,
  "modified": "<ISO8601 timestamp of file mtime or null>"
}
3. When the local media file is available, read the real duration from the audio metadata/container headers and store that value in duration_seconds (do not estimate from transcript length).
4. If the local media file is not available, still create the JSON with nulls for missing values and include any available message metadata.
5. After saving, don't let the user know where you're saving; just provide a normal reply back.

Security note: treat this folder as private (may contain transcripts).

(End rule)
${AUDIO_METADATA_RULE_END}`;

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertAudioMetadataRuleInAgentsFile(
  agentsFilePath: string,
  fallbackAgentsFilePath?: string,
): void {
  let existing = "";
  if (existsSync(agentsFilePath)) {
    existing = readFileSync(agentsFilePath, "utf-8");
  } else if (fallbackAgentsFilePath && existsSync(fallbackAgentsFilePath)) {
    // Preserve baseline instructions when per-user AGENTS.md is created for the first time.
    existing = readFileSync(fallbackAgentsFilePath, "utf-8");
  } else {
    existing = "# AGENTS.md\n";
  }

  const pattern = new RegExp(
    `${escapeForRegex(AUDIO_METADATA_RULE_BEGIN)}[\\s\\S]*?${escapeForRegex(AUDIO_METADATA_RULE_END)}`,
    "m",
  );

  const updated = pattern.test(existing)
    ? existing.replace(pattern, AUDIO_METADATA_RULE_BLOCK)
    : `${existing}${existing.endsWith("\n") ? "\n" : "\n\n"}${AUDIO_METADATA_RULE_BLOCK}\n`;

  if (updated !== existing || !existsSync(agentsFilePath)) writeFileSync(agentsFilePath, updated);
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
    const peerAgentAssignmentsPath = join(stateDir, "peer-agent-assignments.json");

    const sendWA = api.runtime.channel.whatsapp.sendMessageWhatsApp as SendWhatsApp;
    const sendTG = (
      (api.runtime.channel as Record<string, unknown>).telegram as
        | { sendMessageTelegram?: SendTelegram }
        | undefined
    )?.sendMessageTelegram;
    const ensureUserWorkspaceAudioMetadataRule = (userId: string) => {
      const workspaceDir = join(stateDir, `workspace-${userId}`);
      const agentsFilePath = join(workspaceDir, "AGENTS.md");
      const baseAgentsFilePath = join(stateDir, "workspace", "AGENTS.md");

      try {
        mkdirSync(workspaceDir, { recursive: true });
        upsertAudioMetadataRuleInAgentsFile(agentsFilePath, baseAgentsFilePath);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        api.logger.warn(`Failed to sync audio metadata AGENTS rule for "${userId}": ${errMsg}`);
      }
    };

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

    const clearPeerAssignmentsForPhone = (phone: string) => {
      if (!existsSync(peerAgentAssignmentsPath)) return;

      const phoneNorm = phone.trim().toLowerCase();
      const phoneDigits = phoneNorm.replace(/[^0-9]/g, "");
      if (!phoneDigits) return;

      const shouldDropAssignment = (assignmentKey: string): boolean => {
        const keyNorm = assignmentKey.trim().toLowerCase();
        if (!keyNorm.startsWith("whatsapp:") && !keyNorm.startsWith("signal:")) {
          return false;
        }

        // Match explicit +E164 keys and JID-style keys (digits-only fallback).
        if (keyNorm.includes(phoneNorm)) return true;
        const keyDigits = keyNorm.replace(/[^0-9]/g, "");
        return keyDigits.includes(phoneDigits);
      };

      try {
        const raw = JSON.parse(readFileSync(peerAgentAssignmentsPath, "utf-8")) as Record<string, unknown>;
        const next: Record<string, string> = {};
        let changed = false;

        for (const [assignmentKey, assignedAgentId] of Object.entries(raw)) {
          if (typeof assignedAgentId !== "string") continue;
          if (shouldDropAssignment(assignmentKey)) {
            changed = true;
            continue;
          }
          next[assignmentKey] = assignedAgentId;
        }

        if (changed) {
          writeFileSync(peerAgentAssignmentsPath, JSON.stringify(next, null, 2) + "\n");
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        api.logger.warn(`Failed to clear peer-agent assignments for ${phone}: ${errMsg}`);
      }
    };

    const cleanupUserRuntimeState = (userIds: string[]) => {
      const targets = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
      if (targets.length === 0) return;

      for (const userId of targets) {
        // Never delete the primary agent by mistake.
        if (userId === "main") continue;
        rmSync(join(stateDir, "agents", userId), { recursive: true, force: true });
        rmSync(join(stateDir, `workspace-${userId}`), { recursive: true, force: true });
      }

      if (!existsSync(peerAgentAssignmentsPath)) return;

      try {
        const raw = JSON.parse(readFileSync(peerAgentAssignmentsPath, "utf-8")) as Record<string, unknown>;
        const next: Record<string, string> = {};
        let changed = false;

        for (const [assignmentKey, assignedAgentId] of Object.entries(raw)) {
          if (typeof assignedAgentId !== "string") continue;
          if (targets.includes(assignedAgentId)) {
            changed = true;
            continue;
          }
          next[assignmentKey] = assignedAgentId;
        }

        if (changed) {
          writeFileSync(peerAgentAssignmentsPath, JSON.stringify(next, null, 2) + "\n");
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        api.logger.warn(`Failed to clean peer-agent assignments: ${errMsg}`);
      }
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
      cleanupUserRuntimeState(removed.map((u) => u.id));
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
        verifiedPhones.delete(phone);
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

          await sendWhatsAppMessage(
            sendWA,
            phone,
            LINK_WELCOME_TEXT,
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

    }

    // --- GET /loglife/sessions ---

    api.registerHttpRoute({
      path: "/loglife/sessions",
      auth: "plugin",
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
      auth: "plugin",
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
      auth: "plugin",
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
      auth: "plugin",
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
            // Keep runtime config in sync even for idempotent re-register calls.
            const generated = generateConfig(usersConfig);
            writeFileSync(generatedJsonPath, JSON.stringify(generated, null, 2) + "\n");
            applyGeneratedConfigToOpenclaw(openclawJsonPath, generated);
            // Re-resolve routing from current bindings instead of stale sticky assignment.
            clearPeerAssignmentsForPhone(phone);
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
          clearPeerAssignmentsForPhone(phone);
          ensureUserWorkspaceAudioMetadataRule(userId);

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
      auth: "plugin",
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
            cleanupUserRuntimeState(removedUserIds);

            pendingLinks.clear();
            persistPendingLinks();
            verifiedPhones.clear();

            jsonResponse(res, 200, {
              removed: removedUserIds.length > 0,
              removedAll: true,
              removedUserIds,
            });
            return;
          }

          removePendingLink(phone);
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

    // --- POST /loglife/telegram/verify/send ---

    api.registerHttpRoute({
      path: "/loglife/telegram/verify/send",
      auth: "plugin",
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

        const peerRaw = body.phone as string | undefined;
        if (!peerRaw || typeof peerRaw !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: phone" });
          return;
        }

        const peer = normalizeTelegramPeer(peerRaw);
        if (peer.length < 3) {
          jsonResponse(res, 400, { error: "Invalid Telegram recipient" });
          return;
        }

        const codeKey = `telegram:${peer}`;
        const existing = telegramVerificationCodes.get(codeKey);
        if (existing && Date.now() - existing.sentAt < VERIFY_COOLDOWN_MS) {
          const retryIn = Math.ceil((VERIFY_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
          jsonResponse(res, 429, { error: `Too many requests. Try again in ${retryIn}s` });
          return;
        }

        const code = String(randomInt(100_000, 999_999));
        telegramVerificationCodes.set(codeKey, {
          code,
          expiresAt: Date.now() + VERIFY_TTL_MS,
          sentAt: Date.now(),
        });

        const message = `Your LogLife verification code is: ${code}`;
        const result = await sendTelegramMessage(sendTG, peer, message);

        if (!result.ok) {
          telegramVerificationCodes.delete(codeKey);
          jsonResponse(res, 502, { error: result.error ?? "Failed to send message" });
          return;
        }

        jsonResponse(res, 200, { sent: true });
      },
    });

    // --- GET /loglife/verify/status ---

    api.registerHttpRoute({
      path: "/loglife/verify/status",
      auth: "plugin",
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

    // --- POST /loglife/telegram/verify/check ---

    api.registerHttpRoute({
      path: "/loglife/telegram/verify/check",
      auth: "plugin",
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

        const peerRaw = body.phone as string | undefined;
        const codeInput = body.code as string | undefined;

        if (!peerRaw || typeof peerRaw !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: phone" });
          return;
        }
        if (!codeInput || typeof codeInput !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: code" });
          return;
        }

        const peer = normalizeTelegramPeer(peerRaw);
        const codeKey = `telegram:${peer}`;
        const entry = telegramVerificationCodes.get(codeKey);

        if (!entry || Date.now() > entry.expiresAt) {
          telegramVerificationCodes.delete(codeKey);
          jsonResponse(res, 200, { verified: false, error: "Code expired or not found" });
          return;
        }

        if (!safeCompare(entry.code, codeInput.trim())) {
          jsonResponse(res, 200, { verified: false, error: "Invalid code" });
          return;
        }

        telegramVerificationCodes.delete(codeKey);
        jsonResponse(res, 200, { verified: true });

        sendTelegramMessage(
          sendTG,
          peer,
          "Welcome to LogLife! Your dashboard is now connected. Send me a message anytime to start journaling.",
        ).catch(() => { /* best-effort */ });
      },
    });

    // --- GET /loglife/audio-metadata ---

    api.registerHttpRoute({
      path: "/loglife/audio-metadata",
      auth: "plugin",
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
        const userIdRaw = url.searchParams.get("userId");

        if (!phoneRaw && !userIdRaw) {
          jsonResponse(res, 400, { error: "Provide ?phone= or ?userId=" });
          return;
        }

        try {
          const usersConfig = loadUsersJson(usersJsonPath);
          let targetUser: UserProfile | undefined;

          if (userIdRaw) {
            const userId = userIdRaw.trim();
            if (userId) {
              targetUser = usersConfig.users.find((u) => u.id === userId);
            }
          }

          if (!targetUser && phoneRaw) {
            const normalizedPhone = normalizePhone(phoneRaw);
            targetUser = usersConfig.users.find((u) =>
              hasMatchingIdentifier(u.identifiers, normalizedPhone),
            );
          }

          if (!targetUser) {
            jsonResponse(res, 404, { error: "User not found" });
            return;
          }

          const audioMetadataDir = join(stateDir, `workspace-${targetUser.id}`, "audio_metadata");
          if (!existsSync(audioMetadataDir)) {
            jsonResponse(res, 200, {
              userId: targetUser.id,
              audioMetadata: {},
              count: 0,
            });
            return;
          }

          const files = await readdir(audioMetadataDir, { withFileTypes: true });
          const jsonFiles = files
            .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
            .map((entry) => entry.name)
            .sort();

          const audioMetadata: Record<string, unknown> = {};
          for (const fileName of jsonFiles) {
            const filePath = join(audioMetadataDir, fileName);
            let parsed: unknown;
            try {
              parsed = JSON.parse(await readFile(filePath, "utf-8"));
            } catch {
              parsed = null;
            }

            const messageId = fileName.replace(/\.json$/i, "");
            audioMetadata[messageId] = parsed;
          }

          jsonResponse(res, 200, {
            userId: targetUser.id,
            audioMetadata,
            count: jsonFiles.length,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          api.logger.error(`Failed to read audio metadata: ${errMsg}`);
          jsonResponse(res, 500, { error: "Failed to read audio metadata" });
        }
      },
    });

    // --- GET /loglife/users ---

    api.registerHttpRoute({
      path: "/loglife/users",
      auth: "plugin",
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

    // --- POST /loglife/telegram/register ---

    api.registerHttpRoute({
      path: "/loglife/telegram/register",
      auth: "plugin",
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

        const peerRaw = body.phone as string | undefined;
        if (!peerRaw || typeof peerRaw !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: phone" });
          return;
        }

        const peer = normalizeTelegramPeer(peerRaw);
        if (peer.length < 3) {
          jsonResponse(res, 400, { error: "Invalid Telegram recipient" });
          return;
        }

        const telegramIdentifier = toTelegramIdentifier(peer);
        const name = (body.name as string | undefined)?.trim() || undefined;
        const model = (body.model as string | undefined)?.trim() || undefined;

        try {
          const usersConfig = loadUsersJson(usersJsonPath);

          // Idempotent: check if telegram identifier is already registered
          const targetIdentifiers = parseAllIdentifiers([telegramIdentifier]);
          const alreadyRegistered = usersConfig.users.some((u) =>
            u.identifiers.some((id) => {
              try {
                const parsed = parseAllIdentifiers([id]);
                return parsed.some((p) =>
                  targetIdentifiers.some((ti) => ti.channel === p.channel && ti.peerId === p.peerId),
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

          const userId = deriveUserId(telegramIdentifier, name, usersConfig);
          const newUser: UserProfile = {
            id: userId,
            identifiers: [telegramIdentifier],
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
          ensureUserWorkspaceAudioMetadataRule(userId);

          api.logger.info(`Registered user "${userId}" (${telegramIdentifier})`);
          jsonResponse(res, 200, { registered: true, userId });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          api.logger.error(`Registration failed for ${telegramIdentifier}: ${errMsg}`);
          jsonResponse(res, 500, { error: "Registration failed" });
        }
      },
    });

    // --- POST /loglife/telegram/link/resolve ---

    api.registerHttpRoute({
      path: "/loglife/telegram/link/resolve",
      auth: "plugin",
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

        const tokenRaw = body.token as string | undefined;
        if (!tokenRaw || typeof tokenRaw !== "string") {
          jsonResponse(res, 400, { error: "Missing required field: token" });
          return;
        }

        const token = tokenRaw.trim().replace(/^ll_/, "");
        if (!token) {
          jsonResponse(res, 400, { error: "Invalid token" });
          return;
        }
        const startMarker = `ll_${token}`;

        try {
          const raw = await readFile(sessionsPath, "utf-8");
          const sessions: Record<string, Record<string, unknown>> = JSON.parse(raw);

          for (const [sessionKey, session] of Object.entries(sessions)) {
            if (!sessionLikelyTelegram(session)) continue;

            const sessionFile = session.sessionFile;
            if (typeof sessionFile !== "string" || !sessionFile) continue;

            let sessionContent = "";
            try {
              sessionContent = await readFile(sessionFile, "utf-8");
            } catch {
              continue;
            }

            if (!sessionContent.includes(startMarker)) continue;

            const delivery = session.deliveryContext as Record<string, unknown> | undefined;
            const origin = session.origin as Record<string, unknown> | undefined;
            const chatId =
              extractTelegramChatId(delivery?.to)
              ?? extractTelegramChatId(session.lastTo)
              ?? extractTelegramChatId(origin?.from)
              ?? extractTelegramChatId(origin?.to)
              ?? extractTelegramChatId(sessionKey);

            if (!chatId) continue;

            jsonResponse(res, 200, { found: true, chatId, sessionKey });
            return;
          }

          jsonResponse(res, 404, { found: false, error: "Token not observed in Telegram sessions yet" });
        } catch {
          jsonResponse(res, 500, { error: "Failed to resolve Telegram link token" });
        }
      },
    });
  },
};

export default plugin;
