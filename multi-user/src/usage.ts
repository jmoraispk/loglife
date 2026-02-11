/**
 * Usage data utilities.
 *
 * Maps agent IDs from the gateway's sessions.usage API back to user profiles,
 * and aggregates per-user usage statistics. Used by both the CLI `status`
 * command and the dashboard.
 */

import type { UserProfile, UsersConfig } from "./types.ts";

// ---------------------------------------------------------------------------
// Types for the usage API response
// ---------------------------------------------------------------------------

export type AgentUsageTotals = {
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalCost?: number;
  sessionCount?: number;
};

export type AgentUsageEntry = {
  agentId: string;
  totals?: AgentUsageTotals;
};

export type UsageApiResponse = {
  byAgent?: AgentUsageEntry[];
  totals?: AgentUsageTotals;
};

// ---------------------------------------------------------------------------
// User usage mapping
// ---------------------------------------------------------------------------

export type UserUsage = {
  userId: string;
  name: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  sessionCount: number;
};

/**
 * Map gateway usage data (keyed by agentId) to user profiles.
 * Returns one UserUsage entry per user, with zeros if no usage data found.
 */
export function mapUsageToUsers(
  config: UsersConfig,
  usage: UsageApiResponse,
): UserUsage[] {
  const byAgent = usage.byAgent ?? [];
  const agentMap = new Map<string, AgentUsageEntry>();
  for (const entry of byAgent) {
    agentMap.set(entry.agentId, entry);
  }

  return config.users.map((user) => {
    const agentData = agentMap.get(user.id);
    const totals = agentData?.totals ?? {};
    const model = user.model ?? config.defaults?.model ?? "(default)";

    return {
      userId: user.id,
      name: user.name ?? user.id,
      model,
      inputTokens: totals.inputTokens ?? 0,
      outputTokens: totals.outputTokens ?? 0,
      totalTokens: totals.totalTokens ?? 0,
      totalCost: totals.totalCost ?? 0,
      sessionCount: totals.sessionCount ?? 0,
    };
  });
}

/**
 * Compute aggregate totals across all users.
 */
export function aggregateUserUsage(userUsages: UserUsage[]): {
  totalUsers: number;
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
} {
  return {
    totalUsers: userUsages.length,
    totalTokens: userUsages.reduce((sum, u) => sum + u.totalTokens, 0),
    totalCost: userUsages.reduce((sum, u) => sum + u.totalCost, 0),
    totalSessions: userUsages.reduce((sum, u) => sum + u.sessionCount, 0),
  };
}
