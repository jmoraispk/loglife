#!/usr/bin/env node
/**
 * Multi-user CLI.
 *
 * Manages users, generates config, and shows usage status.
 *
 * Usage:
 *   node --experimental-strip-types multi-user/src/cli.ts <command> [options]
 *
 * Commands:
 *   users list                      List all configured users
 *   users add <id> [options]        Add a new user
 *   users remove <id>               Remove a user
 *   users auth set <id> <provider> <key>  Set an API key for a user
 *   generate                        Regenerate config + auth profiles
 *   status                          Show per-user usage (requires running gateway)
 *   wire                            Add $include to openclaw.json
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { UsersConfig, UserProfile } from "./types.ts";
import { parseAllIdentifiers } from "./identifiers.ts";
import { generateConfig } from "./generate.ts";
import { writeAuthProfiles, resolveOpReference } from "./auth-setup.ts";
import { ENV_TO_PROVIDER, DEFAULT_MODEL } from "./types.ts";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const DEFAULT_DIR = path.resolve(SCRIPT_DIR, "..");
const USERS_PATH = path.join(DEFAULT_DIR, "users.json");
const OUTPUT_PATH = path.join(DEFAULT_DIR, "generated.json");

function resolveStateDir(): string {
  return (
    process.env.OPENCLAW_STATE_DIR?.trim() ||
    process.env.CLAWDBOT_STATE_DIR?.trim() ||
    path.join(os.homedir(), ".openclaw")
  );
}

// ---------------------------------------------------------------------------
// Users file I/O
// ---------------------------------------------------------------------------

function loadUsersConfig(): UsersConfig {
  if (!fs.existsSync(USERS_PATH)) {
    return { users: [], defaults: { dmScope: "per-peer" } };
  }
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8")) as UsersConfig;
}

function saveUsersConfig(config: UsersConfig): void {
  fs.writeFileSync(USERS_PATH, JSON.stringify(config, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdUsersList() {
  const config = loadUsersConfig();
  if (config.users.length === 0) {
    console.log("No users configured. Run 'users add <id>' to add one.");
    return;
  }

  const defaultModel = config.defaults?.model ?? DEFAULT_MODEL;
  console.log(`\n  Users (${config.users.length}):  [default model: ${defaultModel}]\n`);
  for (const user of config.users) {
    const identifiers = user.identifiers.join(", ");
    const model = user.model ?? `(default: ${defaultModel})`;
    const skills = user.skills ? user.skills.join(", ") : "(all)";
    const envKeys = user.env ? Object.keys(user.env).join(", ") : "(none)";
    const authKeys = user.auth ? Object.keys(user.auth).join(", ") : "";
    const auth = [envKeys, authKeys].filter((s) => s && s !== "(none)").join(", ") || "(none)";
    const hasOpRefs = user.env && Object.values(user.env).some((v) => v.startsWith("op://"));
    const secretsLabel = hasOpRefs ? " (1Password)" : "";

    console.log(`  ${user.id}${user.name ? ` (${user.name})` : ""}`);
    console.log(`    Identifiers: ${identifiers}`);
    console.log(`    Model:       ${model}`);
    console.log(`    Skills:      ${skills}`);
    console.log(`    Auth:        ${auth}${secretsLabel}`);
    if (user.vault) console.log(`    Vault:       ${user.vault}`);
    console.log();
  }
}

function cmdUsersAdd(args: string[]) {
  const id = args[0];
  if (!id) {
    console.error("Usage: users add <id> [--name NAME] [--identifier ID] [--model MODEL] [--vault VAULT]");
    process.exit(1);
  }

  const config = loadUsersConfig();

  // Check for duplicate
  if (config.users.find((u) => u.id === id)) {
    console.error(`User "${id}" already exists.`);
    process.exit(1);
  }

  const user: UserProfile = { id, identifiers: [] };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      user.name = args[++i];
    } else if (args[i] === "--identifier" && args[i + 1]) {
      user.identifiers.push(args[++i]);
    } else if (args[i] === "--model" && args[i + 1]) {
      user.model = args[++i];
    } else if (args[i] === "--skill" && args[i + 1]) {
      if (!user.skills) user.skills = [];
      user.skills.push(args[++i]);
    } else if (args[i] === "--vault" && args[i + 1]) {
      user.vault = args[++i];
    }
  }

  if (user.identifiers.length === 0) {
    console.error("At least one --identifier is required.");
    process.exit(1);
  }

  // Validate identifiers
  try {
    parseAllIdentifiers(user.identifiers);
  } catch (err) {
    console.error(`Invalid identifier: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // If vault is set, populate env with op:// references for per-user keys only.
  // Shared keys (OpenAI, AssemblyAI, etc.) belong in openclaw.json env section.
  // Only scoped keys (SuperMemory) need per-user isolation.
  if (user.vault) {
    const vaultPath = user.vault.endsWith("/") ? user.vault.slice(0, -1) : user.vault;
    if (!user.env) user.env = {};
    const perUserKeys = [
      "SUPERMEMORY_OPENCLAW_API_KEY",
    ];
    for (const key of perUserKeys) {
      if (!user.env[key]) {
        user.env[key] = `${vaultPath}/${key}`;
      }
    }
    console.log(`Set ${perUserKeys.length} per-user op:// reference(s) from vault: ${vaultPath}`);
  }

  config.users.push(user);
  saveUsersConfig(config);
  console.log(`Added user "${id}" with ${user.identifiers.length} identifier(s).`);
  console.log("Run 'generate' to update the OpenClaw config.");
}

function cmdUsersRemove(args: string[]) {
  const id = args[0];
  if (!id) {
    console.error("Usage: users remove <id>");
    process.exit(1);
  }

  const config = loadUsersConfig();
  const idx = config.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    console.error(`User "${id}" not found.`);
    process.exit(1);
  }

  config.users.splice(idx, 1);
  saveUsersConfig(config);
  console.log(`Removed user "${id}".`);
  console.log("Run 'generate' to update the OpenClaw config.");
  console.log(`Note: Agent data at ~/.openclaw/agents/${id}/ was NOT deleted. Remove it manually if desired.`);
}

function cmdUsersAuthSet(args: string[]) {
  // users auth set <userId> <provider> <apiKey>
  const userId = args[0];
  const provider = args[1];
  const apiKey = args[2];

  if (!userId || !provider || !apiKey) {
    console.error("Usage: users auth set <userId> <provider> <apiKey>");
    console.error("Example: users auth set alice anthropic sk-ant-...");
    process.exit(1);
  }

  const config = loadUsersConfig();
  const user = config.users.find((u) => u.id === userId);
  if (!user) {
    console.error(`User "${userId}" not found.`);
    process.exit(1);
  }

  // Find the env var name for this provider
  const envVarName = Object.entries(ENV_TO_PROVIDER).find(
    ([, p]) => p === provider,
  )?.[0];

  if (envVarName) {
    // Known provider — set in env
    if (!user.env) user.env = {};
    user.env[envVarName] = apiKey;
    saveUsersConfig(config);
    console.log(`Set ${envVarName} for user "${userId}" in users.json.`);
  } else {
    // Unknown provider — set in env with inferred name
    const envName = `${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`;
    if (!user.env) user.env = {};
    user.env[envName] = apiKey;
    saveUsersConfig(config);
    console.log(`Set ${envName} for user "${userId}" in users.json.`);
  }

  // Write to auth profiles immediately
  const stateDir = resolveStateDir();
  const result = writeAuthProfiles(stateDir, user);
  if (result.profileCount > 0) {
    console.log(`Wrote ${result.profileCount} auth profile(s) to ${result.path}`);
  }
}

function cmdGenerate() {
  if (!fs.existsSync(USERS_PATH)) {
    console.error(`No users.json found at ${USERS_PATH}`);
    console.error("Create one from users.example.json or run 'users add'.");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
  const config = raw as UsersConfig;

  console.log(`Found ${config.users.length} user(s)`);

  // Generate config
  const generated = generateConfig(config);

  // Resolve op:// references in shared env before writing
  if (generated.env) {
    const resolvedEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(generated.env)) {
      resolvedEnv[key] = resolveOpReference(value);
    }
    generated.env = resolvedEnv;
    console.log(`  Shared env keys: ${Object.keys(resolvedEnv).length}`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(generated, null, 2) + "\n");
  console.log(`Generated config → ${OUTPUT_PATH}`);
  console.log(`  Agents: ${generated.agents.list.length}`);
  console.log(`  Bindings: ${generated.bindings.length}`);

  // Write auth profiles
  const stateDir = resolveStateDir();
  let totalProfiles = 0;
  for (const user of config.users) {
    const result = writeAuthProfiles(stateDir, user);
    if (result.profileCount > 0) {
      console.log(`  ${user.id}: ${result.profileCount} auth profile(s) → ${result.path}`);
      totalProfiles += result.profileCount;
    }
  }
  // Touch openclaw.json to trigger gateway hot-reload (picks up $include changes)
  const mainConfigPath = path.join(stateDir, "openclaw.json");
  if (fs.existsSync(mainConfigPath)) {
    const now = new Date();
    fs.utimesSync(mainConfigPath, now, now);
    console.log(`Touched ${mainConfigPath} → gateway will reload config.`);
  }

  console.log(`\nDone. ${generated.agents.list.length} agent(s), ${totalProfiles} auth profile(s).`);
}

async function cmdStatus() {
  const config = loadUsersConfig();
  if (config.users.length === 0) {
    console.log("No users configured.");
    return;
  }

  // Try to connect to the gateway for usage data
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "ws://localhost:18789";
  console.log(`Connecting to gateway at ${gatewayUrl}...`);

  try {
    const ws = new WebSocket(gatewayUrl);
    const connected = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => { ws.close(); resolve(false); }, 5000);
      ws.onopen = () => {
        clearTimeout(timeout);
        // Send connect handshake
        const id = crypto.randomUUID();
        ws.send(JSON.stringify({
          type: "req", id,
          method: "connect",
          params: {
            minProtocol: 3, maxProtocol: 3,
            client: { id: "multi-user-cli", version: "0.1.0", platform: "cli", mode: "control" },
          },
        }));

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(typeof event.data === "string" ? event.data : "{}");
            if (data.type === "hello-ok") {
              resolve(true);
            }
          } catch {
            // ignore
          }
        };
      };
      ws.onerror = () => { clearTimeout(timeout); resolve(false); };
    });

    if (!connected) {
      console.log("Could not connect to gateway. Showing config-only info:\n");
      printUsersTable(config);
      return;
    }

    // Request usage data
    const usageId = crypto.randomUUID();
    const usageResult = await new Promise<Record<string, unknown> | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000);
      ws.send(JSON.stringify({
        type: "req", id: usageId,
        method: "sessions.usage",
        params: {},
      }));

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(typeof event.data === "string" ? event.data : "{}");
          if (data.type === "res" && data.id === usageId && data.ok) {
            clearTimeout(timeout);
            resolve(data.payload as Record<string, unknown>);
          }
        } catch {
          // ignore
        }
      };
    });

    ws.close();

    if (usageResult) {
      printUsageTable(config, usageResult);
    } else {
      console.log("Could not fetch usage data. Showing config-only info:\n");
      printUsersTable(config);
    }
  } catch {
    console.log("Gateway not reachable. Showing config-only info:\n");
    printUsersTable(config);
  }
}

function cmdWire() {
  const stateDir = resolveStateDir();
  const configPath = path.join(stateDir, "openclaw.json");

  let raw: Record<string, unknown>;
  if (fs.existsSync(configPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (!raw || typeof raw !== "object") raw = {};
    } catch {
      console.error(`Error: Could not parse ${configPath} as JSON.`);
      process.exit(1);
    }
  } else {
    raw = {};
  }

  const configDir = path.dirname(configPath);
  const generatedPath = path.join(configDir, "multi-user", "generated.json");
  const relativePath = "./" + path.relative(configDir, generatedPath).replace(/\\/g, "/");

  if (raw["$include"] && typeof raw["$include"] === "string" && raw["$include"].includes("multi-user/generated.json")) {
    console.log(`$include already set in ${configPath}. Nothing to do.`);
    return;
  }

  const updated = { $include: relativePath, ...raw };
  updated.$include = relativePath;

  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2) + "\n");
  console.log(`Added "$include": "${relativePath}" to ${configPath}`);
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function printUsersTable(config: UsersConfig) {
  const header = padColumns(["User", "Model", "Identifiers", "Auth Keys"]);
  const separator = "-".repeat(header.length);
  console.log(header);
  console.log(separator);

  for (const user of config.users) {
    const model = user.model ?? config.defaults?.model ?? "(default)";
    const ids = user.identifiers.length.toString();
    const authCount = (user.env ? Object.keys(user.env).length : 0) +
                      (user.auth ? Object.keys(user.auth).length : 0);
    console.log(padColumns([
      user.name ? `${user.id} (${user.name})` : user.id,
      model,
      ids,
      authCount.toString(),
    ]));
  }
}

function printUsageTable(config: UsersConfig, usage: Record<string, unknown>) {
  const byAgent = (usage.byAgent ?? []) as Array<{
    agentId: string;
    totals?: {
      totalTokens?: number;
      inputTokens?: number;
      outputTokens?: number;
      totalCost?: number;
    };
  }>;

  // Map agent IDs to user profiles
  const userMap = new Map<string, UserProfile>();
  for (const user of config.users) {
    userMap.set(user.id, user);
  }

  const header = padColumns(["User", "Model", "Tokens (in/out)", "Est. Cost", "Agent ID"]);
  const separator = "-".repeat(header.length);
  console.log("\n" + header);
  console.log(separator);

  for (const user of config.users) {
    const agentData = byAgent.find((a) => a.agentId === user.id);
    const model = user.model ?? config.defaults?.model ?? "(default)";

    if (agentData?.totals) {
      const t = agentData.totals;
      const inTok = formatTokens(t.inputTokens ?? 0);
      const outTok = formatTokens(t.outputTokens ?? 0);
      const cost = t.totalCost ? `$${t.totalCost.toFixed(2)}` : "$0.00";
      console.log(padColumns([
        user.name ?? user.id,
        model,
        `${inTok} / ${outTok}`,
        cost,
        user.id,
      ]));
    } else {
      console.log(padColumns([
        user.name ?? user.id,
        model,
        "- / -",
        "$0.00",
        user.id,
      ]));
    }
  }
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function padColumns(cols: string[]): string {
  const widths = [24, 36, 18, 10, 14];
  return cols.map((col, i) => col.padEnd(widths[i] ?? 14)).join("  ");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  switch (command) {
    case "users": {
      const subcommand = args[1];
      switch (subcommand) {
        case "list":
          cmdUsersList();
          break;
        case "add":
          cmdUsersAdd(args.slice(2));
          break;
        case "remove":
          cmdUsersRemove(args.slice(2));
          break;
        case "auth":
          if (args[2] === "set") {
            cmdUsersAuthSet(args.slice(3));
          } else {
            console.error("Usage: users auth set <userId> <provider> <apiKey>");
            process.exit(1);
          }
          break;
        default:
          console.error(`Unknown users subcommand: "${subcommand}"`);
          printHelp();
          process.exit(1);
      }
      break;
    }

    case "generate":
      cmdGenerate();
      break;

    case "status":
      await cmdStatus();
      break;

    case "wire":
      cmdWire();
      break;

    default:
      console.error(`Unknown command: "${command}"`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
  OpenClaw Multi-User CLI

  Usage:
    node --experimental-strip-types multi-user/src/cli.ts <command>

  Commands:
    users list                               List all configured users
    users add <id> [options]                 Add a new user
      --name <name>                          Display name
      --identifier <id>                      Channel identifier (repeatable)
      --model <model>                        LLM model (default: ${DEFAULT_MODEL})
      --skill <skill>                        Skill allowlist entry (repeatable)
      --vault <op://path>                    1Password vault path (auto-populates op:// refs)
    users remove <id>                        Remove a user
    users auth set <id> <provider> <key>     Set an API key for a user
    generate                                 Regenerate config + auth profiles
    status                                   Show per-user usage summary
    wire                                     Add $include to openclaw.json

  1Password Integration:
    API keys can be stored as op:// references in users.json instead of raw keys.
    At generate time, op:// values are resolved via the 1Password CLI (op read).
    Use --vault when adding a user to auto-populate op:// references.

  Examples:
    users add alice --name "Alice" --identifier "+1234567890" --vault "op://LogLife_users/alice"
    users auth set alice anthropic sk-ant-api-key-here
    generate
    status
`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
