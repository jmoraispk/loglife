import { describe, it, expect } from "vitest";
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

    expect(result.agents.list).toHaveLength(1);
    expect(result.agents.list[0]).toEqual({
      id: "alice",
      name: "Alice",
      model: "anthropic/claude-sonnet-4-20250514",
      skills: ["web-search"],
    });

    expect(result.bindings).toHaveLength(2);
    expect(result.bindings[0]).toEqual({
      agentId: "alice",
      match: { channel: "whatsapp", peer: { kind: "dm", id: "+1234567890" } },
    });
    expect(result.bindings[1]).toEqual({
      agentId: "alice",
      match: { channel: "signal", peer: { kind: "dm", id: "+1234567890" } },
    });

    expect(result.channels).toHaveProperty("whatsapp");
    expect(result.channels).toHaveProperty("signal");
    const wa = result.channels.whatsapp as Record<string, unknown>;
    expect(wa.allowFrom).toEqual(["+1234567890"]);
    expect(wa.dmPolicy).toBe("open");

    expect(result.session.dmScope).toBe("per-peer");
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

    expect(result.agents.list).toHaveLength(2);
    expect(result.agents.list[0].id).toBe("alice");
    expect(result.agents.list[1].id).toBe("bob");

    expect(result.bindings).toHaveLength(6);

    expect(result.bindings.find((b) => b.agentId === "alice" && b.match.channel === "whatsapp")).toBeTruthy();
    expect(result.bindings.find((b) => b.agentId === "alice" && b.match.channel === "telegram")).toBeTruthy();
    expect(result.bindings.find((b) => b.agentId === "alice" && b.match.channel === "discord")).toBeTruthy();
    expect(result.bindings.find((b) => b.agentId === "bob" && b.match.channel === "whatsapp")).toBeTruthy();

    const wa = result.channels.whatsapp as Record<string, unknown>;
    expect(wa.allowFrom).toEqual(["+0987654321", "+1234567890"]);

    const discord = result.channels.discord as Record<string, Record<string, unknown>>;
    expect(discord.dm.allowFrom).toEqual(["111"]);
    expect(discord.dm.policy).toBe("open");

    const tg = result.channels.telegram as Record<string, unknown>;
    expect(tg.allowFrom).toEqual(["alice_tg"]);
    expect(tg.dmPolicy).toBe("open");
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
    expect(result.agents.list[0].model).toBe("anthropic/claude-sonnet-4-20250514");
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
    expect(result.agents.list[0].model).toBe(DEFAULT_MODEL);
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
    expect(result.agents.list[0]).not.toHaveProperty("skills");
  });

  it("defaults dmScope to main when not specified", () => {
    const config: UsersConfig = {
      users: [
        {
          id: "alice",
          identifiers: ["+1234567890"],
        },
      ],
    };

    const result = generateConfig(config);
    expect(result.session.dmScope).toBe("main");
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
    expect(slack.dm.allowFrom).toEqual(["U012345"]);
    expect(slack.dm.policy).toBe("open");
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
    expect(result.env).toEqual({
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
    expect(result.env).toBeUndefined();
  });
});
