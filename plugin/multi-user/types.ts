/**
 * Multi-user configuration types.
 *
 * These types define the shape of `users.json` — the single source of truth
 * for the multi-user layer. The config generator reads this file and produces
 * a standard OpenClaw config fragment (agents, bindings, allow-lists).
 */

/** A single user profile. Each user maps to one OpenClaw agent. */
export type UserProfile = {
  /** Unique user ID — becomes the OpenClaw agent ID. Must be URL-safe. */
  id: string;

  /** Display name (optional, for dashboards and logs). */
  name?: string;

  /**
   * How to identify this user across messaging channels.
   *
   * Supported formats:
   * - `+<digits>` (E164 phone number) → auto-maps to WhatsApp + Signal
   * - `telegram:<handle_or_id>` → Telegram
   * - `discord:<user_id>` → Discord
   * - `slack:<user_id>` → Slack
   * - `signal:<uuid>` → Signal (UUID, not phone)
   */
  identifiers: string[];

  /** LLM model for this user (e.g., "anthropic/claude-sonnet-4-5"). */
  model?: string;

  /** Skills allowlist for this user (omit = all skills available). */
  skills?: string[];

  /**
   * API keys for this user, keyed by provider env var name.
   * Values can be raw keys or 1Password references (op:// URIs).
   * These are written to per-agent auth-profiles.json, NOT to env vars
   * (because env vars are shared across all agents at config load time).
   *
   * Examples:
   *   { "ANTHROPIC_API_KEY": "sk-ant-..." }            — raw key
   *   { "ANTHROPIC_API_KEY": "op://LogLife_users/alice/ANTHROPIC_API_KEY" } — 1Password ref
   */
  env?: Record<string, string>;

  /**
   * 1Password vault path prefix for this user (e.g., "op://LogLife_users/alice").
   * When set, the `generate` command can auto-discover keys from this vault item
   * and resolve all op:// references at auth-setup time.
   */
  vault?: string;

  /**
   * Advanced: raw auth profile entries for OAuth or token-based providers.
   * Keys are profile IDs (e.g., "openai-codex:default").
   */
  auth?: Record<string, AuthEntry>;
};

/** Auth entry for per-user credential setup. */
export type AuthEntry =
  | { type: "api_key"; provider: string; key: string }
  | {
      type: "oauth";
      provider: string;
      access: string;
      refresh?: string;
      expires?: number;
      email?: string;
    }
  | { type: "token"; provider: string; token: string; expires?: number };

/** The full multi-user config file shape. */
export type UsersConfig = {
  users: UserProfile[];
  /**
   * Shared API keys applied to ALL users via OpenClaw's config `env` section.
   * These end up in `generated.json` → deep-merged into `openclaw.json` via `$include`.
   * Values can be raw keys or `op://` references (resolved at generate time).
   *
   * Use this for provider keys that don't need per-user isolation (OpenAI, AssemblyAI, etc.).
   * Per-user keys (e.g., SuperMemory scoped keys) go in each user's `env` field instead.
   */
  shared?: {
    env?: Record<string, string>;
  };
  defaults?: {
    /** Session isolation level. Default: "main" (one session per agent). */
    dmScope?: string;
    /** Default model if a user doesn't specify one. */
    model?: string;
  };
};

/** A parsed identifier with its resolved channel and peer ID. */
export type ParsedIdentifier = {
  channel: string;
  peerId: string;
};

/** Default model when a user doesn't specify one. */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-4-5";

/** Map of well-known env var names to their provider IDs. */
export const ENV_TO_PROVIDER: Record<string, string> = {
  ANTHROPIC_API_KEY: "anthropic",
  OPENAI_API_KEY: "openai",
  GOOGLE_API_KEY: "google",
  MISTRAL_API_KEY: "mistral",
  GROQ_API_KEY: "groq",
  TOGETHER_API_KEY: "together",
  FIREWORKS_API_KEY: "fireworks",
  DEEPSEEK_API_KEY: "deepseek",
  XAI_API_KEY: "xai",
  COHERE_API_KEY: "cohere",
  PERPLEXITY_API_KEY: "perplexity",
  ASSEMBLYAI_API_KEY: "assemblyai",
  SUPERMEMORY_OPENCLAW_API_KEY: "supermemory",
  DEEPGRAM_API_KEY: "deepgram",
};
