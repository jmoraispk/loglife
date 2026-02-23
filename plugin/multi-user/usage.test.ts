import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapUsageToUsers, aggregateUserUsage } from "./usage.ts";
import type { UsersConfig } from "./types.ts";
import type { UsageApiResponse } from "./usage.ts";

describe("mapUsageToUsers", () => {
  const config: UsersConfig = {
    users: [
      {
        id: "alice",
        name: "Alice",
        identifiers: ["+1234567890"],
        model: "anthropic/claude-sonnet-4-20250514",
      },
      {
        id: "bob",
        name: "Bob",
        identifiers: ["+0987654321"],
        model: "openai/gpt-4o",
      },
    ],
  };

  it("maps usage data to users by agent ID", () => {
    const usage: UsageApiResponse = {
      byAgent: [
        {
          agentId: "alice",
          totals: {
            totalTokens: 20000,
            inputTokens: 12000,
            outputTokens: 8000,
            totalCost: 0.31,
            sessionCount: 5,
          },
        },
        {
          agentId: "bob",
          totals: {
            totalTokens: 5000,
            inputTokens: 3000,
            outputTokens: 2000,
            totalCost: 0.08,
            sessionCount: 2,
          },
        },
      ],
    };

    const result = mapUsageToUsers(config, usage);

    assert.strictEqual(result.length, 2);

    assert.strictEqual(result[0].userId, "alice");
    assert.strictEqual(result[0].name, "Alice");
    assert.strictEqual(result[0].model, "anthropic/claude-sonnet-4-20250514");
    assert.strictEqual(result[0].inputTokens, 12000);
    assert.strictEqual(result[0].outputTokens, 8000);
    assert.strictEqual(result[0].totalCost, 0.31);
    assert.strictEqual(result[0].sessionCount, 5);

    assert.strictEqual(result[1].userId, "bob");
    assert.strictEqual(result[1].totalCost, 0.08);
  });

  it("returns zeros for users with no usage data", () => {
    const usage: UsageApiResponse = {
      byAgent: [
        {
          agentId: "alice",
          totals: { totalTokens: 1000, inputTokens: 600, outputTokens: 400, totalCost: 0.01, sessionCount: 1 },
        },
      ],
    };

    const result = mapUsageToUsers(config, usage);

    // Bob has no usage data
    assert.strictEqual(result[1].userId, "bob");
    assert.strictEqual(result[1].totalTokens, 0);
    assert.strictEqual(result[1].totalCost, 0);
    assert.strictEqual(result[1].sessionCount, 0);
  });

  it("handles empty usage response", () => {
    const result = mapUsageToUsers(config, {});

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].totalTokens, 0);
    assert.strictEqual(result[1].totalTokens, 0);
  });

  it("uses default model when user has no model", () => {
    const configWithDefaults: UsersConfig = {
      users: [
        { id: "charlie", identifiers: ["+111"] },
      ],
      defaults: { model: "anthropic/claude-haiku" },
    };

    const result = mapUsageToUsers(configWithDefaults, {});
    assert.strictEqual(result[0].model, "anthropic/claude-haiku");
  });

  it("uses user ID as name when name is not provided", () => {
    const configNoName: UsersConfig = {
      users: [
        { id: "charlie", identifiers: ["+111"] },
      ],
    };

    const result = mapUsageToUsers(configNoName, {});
    assert.strictEqual(result[0].name, "charlie");
  });

  it("ignores usage data for non-configured agents", () => {
    const usage: UsageApiResponse = {
      byAgent: [
        {
          agentId: "alice",
          totals: { totalTokens: 1000, inputTokens: 600, outputTokens: 400, totalCost: 0.01, sessionCount: 1 },
        },
        {
          agentId: "unknown-agent",
          totals: { totalTokens: 9999, inputTokens: 5000, outputTokens: 4999, totalCost: 99.99, sessionCount: 100 },
        },
      ],
    };

    const result = mapUsageToUsers(config, usage);

    // Only Alice and Bob should be in the result
    assert.strictEqual(result.length, 2);
    assert.ok(!result.find((u) => u.userId === "unknown-agent"));
  });
});

describe("aggregateUserUsage", () => {
  it("sums up totals across users", () => {
    const userUsages = [
      { userId: "alice", name: "Alice", model: "claude", inputTokens: 12000, outputTokens: 8000, totalTokens: 20000, totalCost: 0.31, sessionCount: 5 },
      { userId: "bob", name: "Bob", model: "gpt-4o", inputTokens: 3000, outputTokens: 2000, totalTokens: 5000, totalCost: 0.08, sessionCount: 2 },
    ];

    const result = aggregateUserUsage(userUsages);

    assert.strictEqual(result.totalUsers, 2);
    assert.strictEqual(result.totalTokens, 25000);
    assert.strictEqual(result.totalCost, 0.39);
    assert.strictEqual(result.totalSessions, 7);
  });

  it("handles empty array", () => {
    const result = aggregateUserUsage([]);

    assert.strictEqual(result.totalUsers, 0);
    assert.strictEqual(result.totalTokens, 0);
    assert.strictEqual(result.totalCost, 0);
    assert.strictEqual(result.totalSessions, 0);
  });
});
