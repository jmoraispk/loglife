import { describe, it, expect } from "vitest";
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

    expect(result).toHaveLength(2);

    expect(result[0].userId).toBe("alice");
    expect(result[0].name).toBe("Alice");
    expect(result[0].model).toBe("anthropic/claude-sonnet-4-20250514");
    expect(result[0].inputTokens).toBe(12000);
    expect(result[0].outputTokens).toBe(8000);
    expect(result[0].totalCost).toBe(0.31);
    expect(result[0].sessionCount).toBe(5);

    expect(result[1].userId).toBe("bob");
    expect(result[1].totalCost).toBe(0.08);
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

    expect(result[1].userId).toBe("bob");
    expect(result[1].totalTokens).toBe(0);
    expect(result[1].totalCost).toBe(0);
    expect(result[1].sessionCount).toBe(0);
  });

  it("handles empty usage response", () => {
    const result = mapUsageToUsers(config, {});

    expect(result).toHaveLength(2);
    expect(result[0].totalTokens).toBe(0);
    expect(result[1].totalTokens).toBe(0);
  });

  it("uses default model when user has no model", () => {
    const configWithDefaults: UsersConfig = {
      users: [
        { id: "charlie", identifiers: ["+111"] },
      ],
      defaults: { model: "anthropic/claude-haiku" },
    };

    const result = mapUsageToUsers(configWithDefaults, {});
    expect(result[0].model).toBe("anthropic/claude-haiku");
  });

  it("uses user ID as name when name is not provided", () => {
    const configNoName: UsersConfig = {
      users: [
        { id: "charlie", identifiers: ["+111"] },
      ],
    };

    const result = mapUsageToUsers(configNoName, {});
    expect(result[0].name).toBe("charlie");
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

    expect(result).toHaveLength(2);
    expect(result.find((u) => u.userId === "unknown-agent")).toBeUndefined();
  });
});

describe("aggregateUserUsage", () => {
  it("sums up totals across users", () => {
    const userUsages = [
      { userId: "alice", name: "Alice", model: "claude", inputTokens: 12000, outputTokens: 8000, totalTokens: 20000, totalCost: 0.31, sessionCount: 5 },
      { userId: "bob", name: "Bob", model: "gpt-4o", inputTokens: 3000, outputTokens: 2000, totalTokens: 5000, totalCost: 0.08, sessionCount: 2 },
    ];

    const result = aggregateUserUsage(userUsages);

    expect(result.totalUsers).toBe(2);
    expect(result.totalTokens).toBe(25000);
    expect(result.totalCost).toBe(0.39);
    expect(result.totalSessions).toBe(7);
  });

  it("handles empty array", () => {
    const result = aggregateUserUsage([]);

    expect(result.totalUsers).toBe(0);
    expect(result.totalTokens).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.totalSessions).toBe(0);
  });
});
