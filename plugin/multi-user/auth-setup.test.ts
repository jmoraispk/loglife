import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { buildAuthProfiles, writeAuthProfiles } from "./auth-setup.ts";
import type { UserProfile } from "./types.ts";

describe("buildAuthProfiles", () => {
  it("builds profiles from env-style API keys", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      env: {
        ANTHROPIC_API_KEY: "sk-ant-test",
        OPENAI_API_KEY: "sk-openai-test",
      },
    };

    const store = buildAuthProfiles(user);
    expect(store.version).toBe(1);
    expect(store.profiles["anthropic:default"]).toEqual({
      type: "api_key",
      provider: "anthropic",
      key: "sk-ant-test",
    });
    expect(store.profiles["openai:default"]).toEqual({
      type: "api_key",
      provider: "openai",
      key: "sk-openai-test",
    });
  });

  it("infers provider from unknown env var patterns", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      env: {
        CUSTOM_PROVIDER_API_KEY: "sk-custom",
      },
    };

    const store = buildAuthProfiles(user);
    expect(store.profiles["custom-provider:default"]).toEqual({
      type: "api_key",
      provider: "custom-provider",
      key: "sk-custom",
    });
  });

  it("builds profiles from explicit auth entries", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      auth: {
        "openai-codex:default": {
          type: "oauth",
          provider: "openai-codex",
          access: "access-token",
          refresh: "refresh-token",
          expires: 1234567890,
        },
      },
    };

    const store = buildAuthProfiles(user);
    expect(store.profiles["openai-codex:default"]).toEqual({
      type: "oauth",
      provider: "openai-codex",
      access: "access-token",
      refresh: "refresh-token",
      expires: 1234567890,
      email: undefined,
    });
  });

  it("builds token-type profiles", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      auth: {
        "github:default": {
          type: "token",
          provider: "github",
          token: "ghp_test123",
        },
      },
    };

    const store = buildAuthProfiles(user);
    expect(store.profiles["github:default"]).toEqual({
      type: "token",
      provider: "github",
      token: "ghp_test123",
      expires: undefined,
    });
  });

  it("returns empty profiles when no env or auth", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
    };

    const store = buildAuthProfiles(user);
    expect(store.profiles).toEqual({});
  });

  it("combines env and auth entries", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      env: {
        ANTHROPIC_API_KEY: "sk-ant-test",
      },
      auth: {
        "openai-codex:default": {
          type: "oauth",
          provider: "openai-codex",
          access: "access-token",
        },
      },
    };

    const store = buildAuthProfiles(user);
    expect(Object.keys(store.profiles)).toHaveLength(2);
    expect(store.profiles["anthropic:default"]).toBeDefined();
    expect(store.profiles["openai-codex:default"]).toBeDefined();
  });
});

describe("writeAuthProfiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "multi-user-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes auth profiles to the correct path", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
    };

    const result = writeAuthProfiles(tmpDir, user);

    expect(result.profileCount).toBe(1);
    expect(result.path).toBe(path.join(tmpDir, "agents", "alice", "agent", "auth-profiles.json"));
    expect(result.merged).toBe(false);

    const written = JSON.parse(fs.readFileSync(result.path, "utf-8"));
    expect(written.version).toBe(1);
    expect(written.profiles["anthropic:default"].key).toBe("sk-ant-test");
  });

  it("merges with existing profiles", () => {
    const user: UserProfile = {
      id: "bob",
      identifiers: ["+1234567890"],
      env: { OPENAI_API_KEY: "sk-new" },
    };

    const authDir = path.join(tmpDir, "agents", "bob", "agent");
    fs.mkdirSync(authDir, { recursive: true });
    const existingStore = {
      version: 1,
      profiles: {
        "anthropic:default": {
          type: "api_key",
          provider: "anthropic",
          key: "sk-existing",
        },
      },
    };
    fs.writeFileSync(
      path.join(authDir, "auth-profiles.json"),
      JSON.stringify(existingStore),
    );

    const result = writeAuthProfiles(tmpDir, user);

    expect(result.merged).toBe(true);
    expect(result.profileCount).toBe(2);

    const written = JSON.parse(fs.readFileSync(result.path, "utf-8"));
    expect(written.profiles["anthropic:default"].key).toBe("sk-existing");
    expect(written.profiles["openai:default"].key).toBe("sk-new");
  });

  it("overwrites existing profiles for the same provider", () => {
    const user: UserProfile = {
      id: "bob",
      identifiers: ["+1234567890"],
      env: { ANTHROPIC_API_KEY: "sk-updated" },
    };

    const authDir = path.join(tmpDir, "agents", "bob", "agent");
    fs.mkdirSync(authDir, { recursive: true });
    const existingStore = {
      version: 1,
      profiles: {
        "anthropic:default": {
          type: "api_key",
          provider: "anthropic",
          key: "sk-old",
        },
      },
    };
    fs.writeFileSync(
      path.join(authDir, "auth-profiles.json"),
      JSON.stringify(existingStore),
    );

    const result = writeAuthProfiles(tmpDir, user);

    const written = JSON.parse(fs.readFileSync(result.path, "utf-8"));
    expect(written.profiles["anthropic:default"].key).toBe("sk-updated");
  });

  it("skips users with no auth entries", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
    };

    const result = writeAuthProfiles(tmpDir, user);
    expect(result.profileCount).toBe(0);
    expect(result.path).toBe("");
  });

  it("supports dry-run mode", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
    };

    const result = writeAuthProfiles(tmpDir, user, { dryRun: true });
    expect(result.profileCount).toBe(1);

    expect(fs.existsSync(result.path)).toBe(false);
  });
});
