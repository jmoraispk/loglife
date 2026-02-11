import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateConfig } from "./generate.ts";
import type { UsersConfig } from "./types.ts";
import { DEFAULT_MODEL } from "./types.ts";

describe("generateConfig", () => {
  it("generates config for a single user with a phone number", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          name: "Alice",
          identifiers: ["+1234567890"],
          model: "anthropic/claude-sonnet-4-20250514",
          skills: ["web-search"],
          env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        },
      ],
      defaults: { dmScope: "per-peer" },
    };

    const result = generateConfig(config);

    // Agents
    assert.strictEqual(result.agents.list.length, 1);
    assert.deepStrictEqual(result.agents.list[0], {
      id: "alice",
      name: "Alice",
      model: "anthropic/claude-sonnet-4-20250514",
      skills: ["web-search"],
    });

    // Bindings: phone produces WhatsApp + Signal
    assert.strictEqual(result.bindings.length, 2);
    assert.deepStrictEqual(result.bindings[0], {
      agentId: "alice",
      match: { channel: "whatsapp", peer: { kind: "dm", id: "+1234567890" } },
    });
    assert.deepStrictEqual(result.bindings[1], {
      agentId: "alice",
      match: { channel: "signal", peer: { kind: "dm", id: "+1234567890" } },
    });

    // Allow-lists
    assert.ok("whatsapp" in result.channels);
    assert.ok("signal" in result.channels);
    const wa = result.channels.whatsapp as Record<string, unknown>;
    assert.deepStrictEqual(wa.allowFrom, ["+1234567890"]);
    assert.strictEqual(wa.dmPolicy, "open");

    // Session
    assert.strictEqual(result.session.dmScope, "per-peer");
  });

  it("generates config for two users with multiple channels", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          name: "Alice",
          identifiers: ["+1234567890", "telegram:alice_tg", "discord:111"],
          model: "anthropic/claude-sonnet-4-20250514",
        },
        {
          id: "bob",
          identifiers: ["+0987654321"],
          model: "openai/gpt-4o",
        },
      ],
    };

    const result = generateConfig(config);

    // Agents
    assert.strictEqual(result.agents.list.length, 2);
    assert.strictEqual(result.agents.list[0].id, "alice");
    assert.strictEqual(result.agents.list[1].id, "bob");

    // Alice: 2 (phone) + 1 (telegram) + 1 (discord) = 4 bindings
    // Bob: 2 (phone) = 2 bindings
    assert.strictEqual(result.bindings.length, 6);

    // Check specific bindings exist
    assert.ok(result.bindings.find((b) => b.agentId === "alice" && b.match.channel === "whatsapp"));
    assert.ok(result.bindings.find((b) => b.agentId === "alice" && b.match.channel === "telegram"));
    assert.ok(result.bindings.find((b) => b.agentId === "alice" && b.match.channel === "discord"));
    assert.ok(result.bindings.find((b) => b.agentId === "bob" && b.match.channel === "whatsapp"));

    // WhatsApp allow-list should include both users' phone numbers (sorted)
    const wa = result.channels.whatsapp as Record<string, unknown>;
    assert.deepStrictEqual(wa.allowFrom, ["+0987654321", "+1234567890"]);

    // Discord uses dm.allowFrom (nested)
    const discord = result.channels.discord as Record<string, Record<string, unknown>>;
    assert.deepStrictEqual(discord.dm.allowFrom, ["111"]);
    assert.strictEqual(discord.dm.policy, "open");

    // Telegram uses top-level allowFrom
    const tg = result.channels.telegram as Record<string, unknown>;
    assert.deepStrictEqual(tg.allowFrom, ["alice_tg"]);
    assert.strictEqual(tg.dmPolicy, "open");
  });

  it("uses default model when user has no model", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
      defaults: { model: "anthropic/claude-sonnet-4-20250514" },
    };

    const result = generateConfig(config);
    assert.strictEqual(result.agents.list[0].model, "anthropic/claude-sonnet-4-20250514");
  });

  it("falls back to DEFAULT_MODEL when neither user nor defaults specify one", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
    };

    const result = generateConfig(config);
    assert.strictEqual(result.agents.list[0].model, DEFAULT_MODEL);
  });

  it("omits skills when not specified", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
    };

    const result = generateConfig(config);
    assert.ok(!("skills" in result.agents.list[0]));
  });

  it("defaults dmScope to per-peer when not specified", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
    };

    const result = generateConfig(config);
    assert.strictEqual(result.session.dmScope, "per-peer");
  });

  it("generates Slack allow-lists with dm.allowFrom", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["slack:U012345"],
        },
      ],
    };

    const result = generateConfig(config);
    const slack = result.channels.slack as Record<string, Record<string, unknown>>;
    assert.deepStrictEqual(slack.dm.allowFrom, ["U012345"]);
    assert.strictEqual(slack.dm.policy, "open");
  });

  it("includes shared.env in generated output", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
      shared: {
        env: {
          OPENAI_API_KEY: "sk-test-shared",
          ASSEMBLYAI_API_KEY: "asm-test-shared",
        },
      },
    };

    const result = generateConfig(config);
    assert.deepStrictEqual(result.env, {
      OPENAI_API_KEY: "sk-test-shared",
      ASSEMBLYAI_API_KEY: "asm-test-shared",
    });
  });

  it("omits env when shared.env is not set", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
    };

    const result = generateConfig(config);
    assert.strictEqual(result.env, undefined);
  });
});
