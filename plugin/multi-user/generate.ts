/**
 * Config generator.
 *
 * Takes a UsersConfig and produces a valid OpenClaw config fragment containing
 * agents, bindings, allow-lists, and session settings.
 *
 * The generated output is included via `$include` in the user's `openclaw.json`.
 */

import { parseAllIdentifiers } from "./identifiers.ts";
import type { UsersConfig } from "./types.ts";
import { DEFAULT_MODEL } from "./types.ts";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateUsersConfig(raw: unknown): UsersConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("users.json must be a JSON object");
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.users)) {
    throw new Error('users.json must have a "users" array');
  }

  const seenIds = new Set<string>();
  const seenIdentifiers = new Map<string, string>(); // "channel:peerId" -> userId

  for (const user of obj.users as unknown[]) {
    if (!user || typeof user !== "object") {
      throw new Error("Each user entry must be an object");
    }
    const u = user as Record<string, unknown>;

    if (typeof u.id !== "string" || !u.id.trim()) {
      throw new Error("Each user must have a non-empty string 'id'");
    }
    const userId = u.id.trim();

    if (seenIds.has(userId)) {
      throw new Error(`Duplicate user ID: "${userId}"`);
    }
    seenIds.add(userId);

    if (!Array.isArray(u.identifiers) || u.identifiers.length === 0) {
      throw new Error(`User "${userId}" must have at least one identifier`);
    }

    // Check for identifier collisions across users
    const parsed = parseAllIdentifiers(u.identifiers as string[]);
    for (const entry of parsed) {
      const key = `${entry.channel}:${entry.peerId}`;
      const existing = seenIdentifiers.get(key);
      if (existing) {
        throw new Error(
          `Identifier collision: "${key}" is claimed by both "${existing}" and "${userId}"`,
        );
      }
      seenIdentifiers.set(key, userId);
    }
  }

  return obj as unknown as UsersConfig;
}

// ---------------------------------------------------------------------------
// Allow-list path resolution per channel
// ---------------------------------------------------------------------------

/**
 * Channels that use `channels.<channel>.dm.allowFrom` (nested under `dm`).
 * All others use `channels.<channel>.allowFrom` (top-level).
 */
const DM_NESTED_CHANNELS = new Set(["discord", "slack", "googlechat"]);

/**
 * Build the `channels` section of the generated config.
 * Groups identifiers by channel and sets `allowFrom` and `dmPolicy`.
 */
function buildChannelsConfig(
  allIdentifiers: Map<string, Set<string>>,
): Record<string, unknown> {
  const channels: Record<string, unknown> = {};

  for (const [channel, peerIds] of allIdentifiers) {
    const allowList = [...peerIds].sort();

    if (DM_NESTED_CHANNELS.has(channel)) {
      // Discord, Slack, Google Chat: dm.allowFrom + dm.policy
      channels[channel] = {
        dm: {
          policy: "allowlist",
          allowFrom: allowList,
        },
      };
    } else {
      // WhatsApp, Telegram, Signal, iMessage, etc.: top-level allowFrom + dmPolicy
      channels[channel] = {
        dmPolicy: "allowlist",
        allowFrom: allowList,
      };
    }
  }

  return channels;
}

// ---------------------------------------------------------------------------
// Config generation
// ---------------------------------------------------------------------------

type GeneratedConfig = {
  env?: Record<string, string>;
  agents: {
    list: Array<{
      id: string;
      name?: string;
      model?: string;
      skills?: string[];
    }>;
  };
  bindings: Array<{
    agentId: string;
    match: {
      channel: string;
      peer: { kind: "dm"; id: string };
    };
  }>;
  channels: Record<string, unknown>;
  session: {
    dmScope: string;
  };
};

export function generateConfig(config: UsersConfig): GeneratedConfig {
  const agents: GeneratedConfig["agents"]["list"] = [];
  const bindings: GeneratedConfig["bindings"] = [];
  const channelPeers = new Map<string, Set<string>>();
  const dmScope = config.defaults?.dmScope ?? "main";
  const defaultModel = config.defaults?.model ?? DEFAULT_MODEL;

  for (const user of config.users) {
    // Build agent entry
    const agent: (typeof agents)[number] = { id: user.id };
    if (user.name) agent.name = user.name;
    const model = user.model ?? defaultModel;
    if (model) agent.model = model;
    if (user.skills) agent.skills = user.skills;
    agents.push(agent);

    // Parse identifiers and create bindings + allow-lists
    const parsed = parseAllIdentifiers(user.identifiers);
    for (const entry of parsed) {
      // Binding: route this sender to this agent
      bindings.push({
        agentId: user.id,
        match: {
          channel: entry.channel,
          peer: { kind: "dm", id: entry.peerId },
        },
      });

      // Collect for allow-list
      if (!channelPeers.has(entry.channel)) {
        channelPeers.set(entry.channel, new Set());
      }
      channelPeers.get(entry.channel)!.add(entry.peerId);
    }
  }

  const result: GeneratedConfig = {
    agents: { list: agents },
    bindings,
    channels: buildChannelsConfig(channelPeers),
    session: { dmScope },
  };

  // Include shared env keys (resolved from op:// at auth-setup time, raw here)
  if (config.shared?.env && Object.keys(config.shared.env).length > 0) {
    result.env = { ...config.shared.env };
  }

  return result;
}
