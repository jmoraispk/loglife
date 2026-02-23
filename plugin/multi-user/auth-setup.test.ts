import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
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
    assert.strictEqual(store.version, 1);
    assert.deepStrictEqual(store.profiles["anthropic:default"], {
      type: "api_key",
      provider: "anthropic",
      key: "sk-ant-test",
    });
    assert.deepStrictEqual(store.profiles["openai:default"], {
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
    assert.deepStrictEqual(store.profiles["custom-provider:default"], {
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
    assert.deepStrictEqual(store.profiles["openai-codex:default"], {
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
    assert.deepStrictEqual(store.profiles["github:default"], {
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
    assert.deepStrictEqual(store.profiles, {});
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
    assert.strictEqual(Object.keys(store.profiles).length, 2);
    assert.ok(store.profiles["anthropic:default"]);
    assert.ok(store.profiles["openai-codex:default"]);
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

    assert.strictEqual(result.profileCount, 1);
    assert.strictEqual(result.path, path.join(tmpDir, "agents", "alice", "agent", "auth-profiles.json"));
    assert.strictEqual(result.merged, false);

    // Verify the file was actually written
    const written = JSON.parse(fs.readFileSync(result.path, "utf-8"));
    assert.strictEqual(written.version, 1);
    assert.strictEqual(written.profiles["anthropic:default"].key, "sk-ant-test");
  });

  it("merges with existing profiles", () => {
    const user: UserProfile = {
      id: "bob",
      identifiers: ["+1234567890"],
      env: { OPENAI_API_KEY: "sk-new" },
    };

    // Create an existing auth profile
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

    assert.strictEqual(result.merged, true);
    assert.strictEqual(result.profileCount, 2); // existing + new

    const written = JSON.parse(fs.readFileSync(result.path, "utf-8"));
    assert.strictEqual(written.profiles["anthropic:default"].key, "sk-existing");
    assert.strictEqual(written.profiles["openai:default"].key, "sk-new");
  });

  it("overwrites existing profiles for the same provider", () => {
    const user: UserProfile = {
      id: "bob",
      identifiers: ["+1234567890"],
      env: { ANTHROPIC_API_KEY: "sk-updated" },
    };

    // Create an existing auth profile with the same provider
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
    assert.strictEqual(written.profiles["anthropic:default"].key, "sk-updated");
  });

  it("skips users with no auth entries", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
    };

    const result = writeAuthProfiles(tmpDir, user);
    assert.strictEqual(result.profileCount, 0);
    assert.strictEqual(result.path, "");
  });

  it("supports dry-run mode", () => {
    const user: UserProfile = {
      id: "alice",
      identifiers: ["+1234567890"],
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
    };

    const result = writeAuthProfiles(tmpDir, user, { dryRun: true });
    assert.strictEqual(result.profileCount, 1);

    // File should NOT exist in dry-run mode
    assert.strictEqual(fs.existsSync(result.path), false);
  });
});
