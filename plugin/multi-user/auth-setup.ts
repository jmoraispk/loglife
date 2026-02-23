/**
 * Auth profile setup.
 *
 * Writes per-user API keys to each agent's `auth-profiles.json` file at
 * `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
 *
 * This is the correct mechanism for per-user API key isolation because
 * auth profiles are resolved per-agent at runtime (unlike env vars which
 * are global to the process).
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { UserProfile, AuthEntry } from "./types.ts";
import { ENV_TO_PROVIDER } from "./types.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Auth profile store version (must match OpenClaw's AUTH_STORE_VERSION). */
const AUTH_STORE_VERSION = 1;

/** Filename for auth profiles (must match OpenClaw's AUTH_PROFILE_FILENAME). */
const AUTH_PROFILE_FILENAME = "auth-profiles.json";

// ---------------------------------------------------------------------------
// 1Password (op://) secret resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a single value that may be a 1Password reference.
 * If the value starts with "op://", shells out to `op read` to fetch the secret.
 * Raw values are returned as-is.
 */
export function resolveOpReference(value: string): string {
  if (!value.startsWith("op://")) return value;

  try {
    // Use execFileSync to avoid shell injection; timeout after 15s
    const result = execFileSync("op", ["read", value], {
      encoding: "utf-8",
      timeout: 15_000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (!result) {
      throw new Error(`1Password returned empty value for: ${value}`);
    }
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Provide a helpful message if `op` is not found
    if (msg.includes("ENOENT")) {
      throw new Error(
        `1Password CLI (op) not found. Install it or replace op:// references with raw keys.\n  Reference: ${value}`,
      );
    }
    throw new Error(`Failed to resolve 1Password reference: ${value}\n  ${msg}`);
  }
}

/**
 * Resolve all op:// references in a user profile's env and auth entries.
 * Returns a new UserProfile with secrets resolved (the original is not mutated).
 */
export function resolveUserSecrets(user: UserProfile): UserProfile {
  const resolved = { ...user };

  // Resolve env values
  if (resolved.env) {
    const resolvedEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(resolved.env)) {
      resolvedEnv[key] = resolveOpReference(value);
    }
    resolved.env = resolvedEnv;
  }

  // Resolve auth entry keys/tokens
  if (resolved.auth) {
    const resolvedAuth: Record<string, AuthEntry> = {};
    for (const [profileId, entry] of Object.entries(resolved.auth)) {
      if (entry.type === "api_key") {
        resolvedAuth[profileId] = { ...entry, key: resolveOpReference(entry.key) };
      } else if (entry.type === "token" && entry.token) {
        resolvedAuth[profileId] = { ...entry, token: resolveOpReference(entry.token) };
      } else if (entry.type === "oauth") {
        resolvedAuth[profileId] = {
          ...entry,
          access: resolveOpReference(entry.access),
          ...(entry.refresh ? { refresh: resolveOpReference(entry.refresh) } : {}),
        };
      } else {
        resolvedAuth[profileId] = entry;
      }
    }
    resolved.auth = resolvedAuth;
  }

  return resolved;
}

/**
 * Check whether any user profile contains op:// references that need resolution.
 */
export function hasOpReferences(user: UserProfile): boolean {
  if (user.env) {
    for (const value of Object.values(user.env)) {
      if (value.startsWith("op://")) return true;
    }
  }
  if (user.auth) {
    for (const entry of Object.values(user.auth)) {
      if (entry.type === "api_key" && entry.key.startsWith("op://")) return true;
      if (entry.type === "token" && entry.token?.startsWith("op://")) return true;
      if (entry.type === "oauth" && entry.access.startsWith("op://")) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Auth profile building
// ---------------------------------------------------------------------------

type AuthProfileCredential = {
  type: "api_key" | "oauth" | "token";
  provider: string;
  key?: string;
  token?: string;
  access?: string;
  refresh?: string;
  expires?: number;
  email?: string;
};

type AuthProfileStore = {
  version: number;
  profiles: Record<string, AuthProfileCredential>;
};

/**
 * Build an auth profile store from a user's `env` and `auth` entries.
 *
 * - `env` entries (e.g., `ANTHROPIC_API_KEY`) are mapped to API key profiles
 *   using the ENV_TO_PROVIDER mapping.
 * - `auth` entries are written as-is (for OAuth/token credentials).
 */
export function buildAuthProfiles(user: UserProfile): AuthProfileStore {
  const profiles: Record<string, AuthProfileCredential> = {};

  // Process env-style API keys
  if (user.env) {
    for (const [envVar, apiKey] of Object.entries(user.env)) {
      const provider = ENV_TO_PROVIDER[envVar];
      if (!provider) {
        // Unknown env var — try to infer provider from name pattern
        // e.g., "MISTRAL_API_KEY" -> "mistral"
        const match = envVar.match(/^([A-Z_]+?)_API_KEY$/);
        const inferredProvider = match ? match[1].toLowerCase().replace(/_/g, "-") : envVar.toLowerCase();
        const profileId = `${inferredProvider}:default`;
        profiles[profileId] = {
          type: "api_key",
          provider: inferredProvider,
          key: apiKey,
        };
      } else {
        const profileId = `${provider}:default`;
        profiles[profileId] = {
          type: "api_key",
          provider,
          key: apiKey,
        };
      }
    }
  }

  // Process explicit auth entries
  if (user.auth) {
    for (const [profileId, entry] of Object.entries(user.auth)) {
      if (entry.type === "api_key") {
        profiles[profileId] = {
          type: "api_key",
          provider: entry.provider,
          key: entry.key,
        };
      } else if (entry.type === "oauth") {
        profiles[profileId] = {
          type: "oauth",
          provider: entry.provider,
          access: entry.access,
          refresh: entry.refresh,
          expires: entry.expires,
          email: entry.email,
        };
      } else if (entry.type === "token") {
        profiles[profileId] = {
          type: "token",
          provider: entry.provider,
          token: entry.token,
          expires: entry.expires,
        };
      }
    }
  }

  return {
    version: AUTH_STORE_VERSION,
    profiles,
  };
}

/**
 * Resolve the auth-profiles.json path for a given agent.
 */
function resolveAgentAuthPath(stateDir: string, agentId: string): string {
  return path.join(stateDir, "agents", agentId, "agent", AUTH_PROFILE_FILENAME);
}

/**
 * Write auth profiles for a user, merging with any existing profiles.
 *
 * If a profile already exists on disk, we merge our profiles into it
 * (our entries take precedence). This preserves any profiles that were
 * set up via `openclaw models auth login` or other external tools.
 *
 * Automatically resolves op:// references via 1Password CLI before writing.
 */
export function writeAuthProfiles(
  stateDir: string,
  user: UserProfile,
  options: { dryRun?: boolean } = {},
): { path: string; profileCount: number; merged: boolean } {
  // Resolve 1Password references before building profiles
  const resolvedUser = hasOpReferences(user) ? resolveUserSecrets(user) : user;
  const authStore = buildAuthProfiles(resolvedUser);
  if (Object.keys(authStore.profiles).length === 0) {
    return { path: "", profileCount: 0, merged: false };
  }

  const authPath = resolveAgentAuthPath(stateDir, user.id);
  const dir = path.dirname(authPath);

  // Try to load existing profiles to merge
  let existing: AuthProfileStore | null = null;
  let merged = false;
  if (fs.existsSync(authPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(authPath, "utf-8")) as AuthProfileStore;
      merged = true;
    } catch {
      // Corrupted file — overwrite
    }
  }

  const finalStore: AuthProfileStore = {
    version: AUTH_STORE_VERSION,
    profiles: {
      ...(existing?.profiles ?? {}),
      ...authStore.profiles, // Our entries take precedence
    },
  };

  if (options.dryRun) {
    console.log(`  [dry-run] Would write ${Object.keys(finalStore.profiles).length} profiles to ${authPath}`);
    return { path: authPath, profileCount: Object.keys(finalStore.profiles).length, merged };
  }

  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });

  // Write atomically: write to tmp then rename
  const tmpPath = authPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(finalStore, null, 2) + "\n");
  fs.renameSync(tmpPath, authPath);

  return { path: authPath, profileCount: Object.keys(finalStore.profiles).length, merged };
}
