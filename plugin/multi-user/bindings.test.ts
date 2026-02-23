/**
 * Binding resolution tests.
 *
 * These tests verify that the generated config produces bindings that
 * would be correctly resolved by OpenClaw's `resolveAgentRoute()`.
 *
 * Since we can't easily import OpenClaw's routing code in this standalone
 * package, we re-implement the core matching logic inline to validate that
 * our generated bindings have the correct structure.
 *
 * The binding resolution algorithm (from src/routing/resolve-route.ts):
 * 1. Filter bindings by channel + accountId match
 * 2. Among filtered bindings, find peer match (channel + peer.kind + peer.id)
 * 3. If no peer match, fall through to channel/account/default matches
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateConfig } from "./generate.ts";
import type { UsersConfig } from "./types.ts";

// ---------------------------------------------------------------------------
// Lightweight binding resolution (mirrors OpenClaw's logic)
// ---------------------------------------------------------------------------

type Binding = {
  agentId: string;
  match: {
    channel: string;
    accountId?: string;
    peer?: { kind: string; id: string };
  };
};

type Peer = { kind: string; id: string };

/**
 * Simplified version of resolveAgentRoute — finds which agentId
 * a given channel + peer would route to, based on the generated bindings.
 */
function resolveBinding(
  bindings: Binding[],
  channel: string,
  peer: Peer,
): string | null {
  const channelNorm = channel.toLowerCase().trim();

  // Step 1: filter by channel (and default account)
  const channelBindings = bindings.filter((b) => {
    const matchChannel = (b.match.channel ?? "").toLowerCase().trim();
    if (matchChannel !== channelNorm) return false;
    // No accountId filter (or default)
    const accountId = (b.match.accountId ?? "").trim();
    return !accountId || accountId === "default";
  });

  // Step 2: find exact peer match
  const peerMatch = channelBindings.find((b) => {
    if (!b.match.peer) return false;
    return (
      b.match.peer.kind === peer.kind &&
      b.match.peer.id.trim() === peer.id.trim()
    );
  });

  return peerMatch?.agentId ?? null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("binding resolution", () => {
  const config: UsersConfig = {
    users: [
      {
        id: "alice",
        name: "Alice",
        identifiers: ["+1234567890", "telegram:alice_tg", "discord:111222333"],
        model: "anthropic/claude-sonnet-4-20250514",
      },
      {
        id: "bob",
        name: "Bob",
        identifiers: ["+0987654321", "telegram:bob_tg"],
        model: "openai/gpt-4o",
      },
    ],
  };

  const generated = generateConfig(config);
  const bindings = generated.bindings as unknown as Binding[];

  it("routes Alice's WhatsApp message to alice agent", () => {
    const result = resolveBinding(bindings, "whatsapp", { kind: "dm", id: "+1234567890" });
    assert.strictEqual(result, "alice");
  });

  it("routes Bob's WhatsApp message to bob agent", () => {
    const result = resolveBinding(bindings, "whatsapp", { kind: "dm", id: "+0987654321" });
    assert.strictEqual(result, "bob");
  });

  it("routes Alice's Signal message to alice agent", () => {
    const result = resolveBinding(bindings, "signal", { kind: "dm", id: "+1234567890" });
    assert.strictEqual(result, "alice");
  });

  it("routes Bob's Signal message to bob agent", () => {
    const result = resolveBinding(bindings, "signal", { kind: "dm", id: "+0987654321" });
    assert.strictEqual(result, "bob");
  });

  it("routes Alice's Telegram message to alice agent", () => {
    const result = resolveBinding(bindings, "telegram", { kind: "dm", id: "alice_tg" });
    assert.strictEqual(result, "alice");
  });

  it("routes Bob's Telegram message to bob agent", () => {
    const result = resolveBinding(bindings, "telegram", { kind: "dm", id: "bob_tg" });
    assert.strictEqual(result, "bob");
  });

  it("routes Alice's Discord message to alice agent", () => {
    const result = resolveBinding(bindings, "discord", { kind: "dm", id: "111222333" });
    assert.strictEqual(result, "alice");
  });

  it("returns null for unknown senders", () => {
    const result = resolveBinding(bindings, "whatsapp", { kind: "dm", id: "+9999999999" });
    assert.strictEqual(result, null);
  });

  it("does not cross-route between users", () => {
    // Alice's phone should NOT route to bob
    const aliceToWA = resolveBinding(bindings, "whatsapp", { kind: "dm", id: "+1234567890" });
    assert.notStrictEqual(aliceToWA, "bob");

    // Bob's phone should NOT route to alice
    const bobToWA = resolveBinding(bindings, "whatsapp", { kind: "dm", id: "+0987654321" });
    assert.notStrictEqual(bobToWA, "alice");
  });

  it("generates correct agent definitions", () => {
    const agents = generated.agents.list;
    assert.strictEqual(agents.length, 2);

    const alice = agents.find((a) => a.id === "alice");
    assert.ok(alice);
    assert.strictEqual(alice.name, "Alice");
    assert.strictEqual(alice.model, "anthropic/claude-sonnet-4-20250514");

    const bob = agents.find((a) => a.id === "bob");
    assert.ok(bob);
    assert.strictEqual(bob.name, "Bob");
    assert.strictEqual(bob.model, "openai/gpt-4o");
  });

  it("generates correct allow-lists", () => {
    // WhatsApp should include both users
    const wa = generated.channels.whatsapp as Record<string, unknown>;
    const waAllow = wa.allowFrom as string[];
    assert.ok(waAllow.includes("+1234567890"));
    assert.ok(waAllow.includes("+0987654321"));

    // Telegram should include both users
    const tg = generated.channels.telegram as Record<string, unknown>;
    const tgAllow = tg.allowFrom as string[];
    assert.ok(tgAllow.includes("alice_tg"));
    assert.ok(tgAllow.includes("bob_tg"));

    // Discord should only include Alice
    const discord = generated.channels.discord as Record<string, Record<string, unknown>>;
    const discordAllow = discord.dm.allowFrom as string[];
    assert.ok(discordAllow.includes("111222333"));
    assert.strictEqual(discordAllow.length, 1);
  });
});
