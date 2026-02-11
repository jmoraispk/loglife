/**
 * Identifier parser.
 *
 * Translates human-friendly identifiers (phone numbers, channel handles)
 * into OpenClaw's { channel, peerId } format for use in bindings and allow-lists.
 *
 * Rules:
 *  - `+<digits>` (E164 phone number) → WhatsApp + Signal entries
 *  - `telegram:<value>` → Telegram
 *  - `discord:<value>` → Discord
 *  - `slack:<value>` → Slack
 *  - `signal:<value>` → Signal (UUID, distinct from phone)
 *  - `web:<value>` → Web (WhatsApp Web)
 *  - `matrix:<value>` → Matrix
 */

import type { ParsedIdentifier } from "./types.ts";

/** Known channel prefixes. */
const CHANNEL_PREFIXES = new Set([
  "telegram",
  "discord",
  "slack",
  "signal",
  "web",
  "matrix",
  "whatsapp",
  "imessage",
  "msteams",
  "zalo",
  "zalouser",
]);

/** E164 phone number pattern: starts with + followed by digits. */
const E164_REGEX = /^\+\d{7,15}$/;

/**
 * Parse a single identifier string into one or more { channel, peerId } entries.
 *
 * Phone numbers (E164) produce TWO entries (WhatsApp + Signal) because
 * a user might message from either platform.
 *
 * @throws {Error} if the identifier format is not recognized.
 */
export function parseIdentifier(identifier: string): ParsedIdentifier[] {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new Error("Empty identifier");
  }

  // E164 phone number → WhatsApp + Signal
  if (trimmed.startsWith("+")) {
    if (!E164_REGEX.test(trimmed)) {
      throw new Error(
        `Invalid E164 phone number: "${trimmed}". Expected format: +<7-15 digits>`,
      );
    }
    return [
      { channel: "whatsapp", peerId: trimmed },
      { channel: "signal", peerId: trimmed },
    ];
  }

  // Prefixed identifier: "channel:value"
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex > 0) {
    const prefix = trimmed.slice(0, colonIndex).toLowerCase();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (!value) {
      throw new Error(`Empty value after prefix "${prefix}:" in identifier "${trimmed}"`);
    }

    if (!CHANNEL_PREFIXES.has(prefix)) {
      throw new Error(
        `Unknown channel prefix "${prefix}" in identifier "${trimmed}". ` +
          `Known prefixes: ${[...CHANNEL_PREFIXES].sort().join(", ")}`,
      );
    }

    return [{ channel: prefix, peerId: value }];
  }

  throw new Error(
    `Unrecognized identifier format: "${trimmed}". ` +
      `Expected E164 phone number (+1234567890) or prefixed (telegram:handle).`,
  );
}

/**
 * Parse all identifiers for a user.
 * Returns deduplicated entries (same channel+peerId pair only appears once).
 */
export function parseAllIdentifiers(identifiers: string[]): ParsedIdentifier[] {
  const seen = new Set<string>();
  const result: ParsedIdentifier[] = [];

  for (const id of identifiers) {
    const parsed = parseIdentifier(id);
    for (const entry of parsed) {
      const key = `${entry.channel}:${entry.peerId}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(entry);
      }
    }
  }

  return result;
}
