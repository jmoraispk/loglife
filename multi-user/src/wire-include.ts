/**
 * Wire the $include directive into openclaw.json.
 *
 * This is a one-time operation. It reads the user's openclaw.json,
 * adds `"$include": "./multi-user/generated.json"` if not already present,
 * and writes it back.
 *
 * Usage:
 *   bun multi-user/src/wire-include.ts [--config ~/.openclaw/openclaw.json]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function resolveConfigPath(): string {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && args[i + 1]) {
      return path.resolve(args[++i]);
    }
  }

  // Default: look for openclaw.json in the standard locations
  const stateDir =
    process.env.OPENCLAW_STATE_DIR?.trim() ||
    process.env.CLAWDBOT_STATE_DIR?.trim() ||
    path.join(os.homedir(), ".openclaw");

  const candidates = [
    path.join(stateDir, "openclaw.json"),
    path.join(stateDir, "openclaw.json5"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Default to the first candidate
  return candidates[0];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const configPath = resolveConfigPath();
  console.log(`Config file: ${configPath}`);

  // Load existing config or create an empty one
  let raw: Record<string, unknown>;
  if (fs.existsSync(configPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (!raw || typeof raw !== "object") {
        raw = {};
      }
    } catch {
      console.error(`Error: Could not parse ${configPath} as JSON.`);
      process.exit(1);
    }
  } else {
    raw = {};
    console.log("Config file does not exist. Creating a new one.");
  }

  // Compute the include path relative to the config file's directory
  const configDir = path.dirname(configPath);
  const generatedPath = path.join(configDir, "multi-user", "generated.json");
  const relativePath = "./" + path.relative(configDir, generatedPath).replace(/\\/g, "/");

  // Check if $include is already set
  if (raw["$include"]) {
    const existing = raw["$include"];
    if (typeof existing === "string" && existing.includes("multi-user/generated.json")) {
      console.log(`$include already set to "${existing}". Nothing to do.`);
      return;
    }
    console.warn(
      `Warning: $include is already set to "${existing}". ` +
        `Overwriting with "${relativePath}".`,
    );
  }

  // Add $include at the top (recreate the object with $include first)
  const updated: Record<string, unknown> = {
    $include: relativePath,
    ...raw,
  };
  // Ensure $include is our value (in case ...raw had an old one)
  updated.$include = relativePath;

  // Write back
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const output = JSON.stringify(updated, null, 2) + "\n";
  fs.writeFileSync(configPath, output);

  console.log(`Added "$include": "${relativePath}" to ${configPath}`);
  console.log("\nYour openclaw.json now includes the multi-user generated config.");
  console.log("Run 'bun multi-user/src/generate.ts' to generate/update the config fragment.");
}

main();
