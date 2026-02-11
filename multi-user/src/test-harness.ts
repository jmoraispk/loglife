/**
 * Multi-user test harness.
 *
 * Connects to the OpenClaw gateway via WebSocket and verifies that different
 * agents have isolated API keys, models, and memory.
 *
 * Usage:
 *   bun multi-user/src/test-harness.ts [--gateway ws://localhost:18789] [--password <pw>]
 *
 * Requires a running gateway with at least two agents configured.
 */

import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TestCase = {
  name: string;
  agentId: string;
  message: string;
  /** Substrings the response should contain (case-insensitive). */
  expectInResponse?: string[];
  /** Substrings the response must NOT contain (case-insensitive). */
  rejectInResponse?: string[];
  /** Skip this test (for conditional suites). */
  skip?: boolean;
};

type TestResult = {
  name: string;
  passed: boolean;
  details: string[];
  response: string;
};

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(): { gatewayUrl: string; password?: string; timeout: number } {
  const args = process.argv.slice(2);
  let gatewayUrl = "ws://localhost:18789";
  let password: string | undefined;
  let timeout = 60_000; // 60s per message

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--gateway" && args[i + 1]) {
      gatewayUrl = args[++i];
    } else if (args[i] === "--password" && args[i + 1]) {
      password = args[++i];
    } else if (args[i] === "--timeout" && args[i + 1]) {
      timeout = parseInt(args[++i], 10);
    }
  }

  return { gatewayUrl, password, timeout };
}

// ---------------------------------------------------------------------------
// WebSocket gateway client
// ---------------------------------------------------------------------------

type PendingRequest = {
  resolve: (payload: unknown) => void;
  reject: (err: Error) => void;
};

type ChatEvent = {
  event: string;
  payload: Record<string, unknown>;
};

class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private chatEvents: ChatEvent[] = [];
  private chatResolvers: Array<(event: ChatEvent) => void> = [];
  private connected = false;

  async connect(url: string, password?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // Send the connect handshake
        const connectReq = {
          type: "req",
          id: randomUUID(),
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "multi-user-test-harness",
              displayName: "Test Harness",
              version: "0.1.0",
              platform: "test",
              mode: "webchat",
            },
            ...(password ? { auth: { password } } : {}),
          },
        };
        this.ws!.send(JSON.stringify(connectReq));
      };

      this.ws.onmessage = (event) => {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(typeof event.data === "string" ? event.data : "{}");
        } catch {
          return;
        }

        // Handle hello-ok (handshake response)
        if (data.type === "hello-ok") {
          this.connected = true;
          resolve();
          return;
        }

        // Handle response frames
        if (data.type === "res" && typeof data.id === "string") {
          const pending = this.pending.get(data.id);
          if (pending) {
            this.pending.delete(data.id);
            if (data.ok) {
              pending.resolve(data.payload);
            } else {
              pending.reject(new Error(JSON.stringify(data.error ?? "unknown error")));
            }
          }
          return;
        }

        // Handle event frames (chat events, etc.)
        if (data.type === "event") {
          const chatEvent = { event: data.event as string, payload: data.payload as Record<string, unknown> };
          const waiter = this.chatResolvers.shift();
          if (waiter) {
            waiter(chatEvent);
          } else {
            this.chatEvents.push(chatEvent);
          }
          return;
        }

        // Handle error frames on connect
        if (data.type === "res" && data.ok === false && !this.connected) {
          reject(new Error(`Gateway connect failed: ${JSON.stringify(data.error)}`));
          return;
        }
      };

      this.ws.onerror = (err) => {
        if (!this.connected) {
          reject(new Error(`WebSocket error: ${err}`));
        }
      };

      this.ws.onclose = () => {
        // Reject all pending requests
        for (const [, pending] of this.pending) {
          pending.reject(new Error("WebSocket closed"));
        }
        this.pending.clear();
      };
    });
  }

  /** Send a typed request and wait for the response. */
  async request(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || !this.connected) {
      throw new Error("Not connected");
    }

    const id = randomUUID();
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(
        JSON.stringify({ type: "req", id, method, params }),
      );
    });
  }

  /** Wait for the next chat event matching a filter. */
  async waitForChatEvent(
    filter: (e: ChatEvent) => boolean,
    timeoutMs: number,
  ): Promise<ChatEvent> {
    // Check buffered events first
    const idx = this.chatEvents.findIndex(filter);
    if (idx >= 0) {
      return this.chatEvents.splice(idx, 1)[0];
    }

    return new Promise<ChatEvent>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for chat event (${timeoutMs}ms)`));
      }, timeoutMs);

      const check = (event: ChatEvent) => {
        if (filter(event)) {
          clearTimeout(timer);
          resolve(event);
        } else {
          // Re-buffer and wait for next
          this.chatEvents.push(event);
          this.chatResolvers.push(check);
        }
      };
      this.chatResolvers.push(check);
    });
  }

  close() {
    this.ws?.close();
  }
}

// ---------------------------------------------------------------------------
// Send a message and collect the full response
// ---------------------------------------------------------------------------

async function sendMessageAndGetResponse(
  client: GatewayClient,
  agentId: string,
  message: string,
  timeoutMs: number,
): Promise<string> {
  const sessionKey = `agent:${agentId}:test-harness`;
  const idempotencyKey = randomUUID();

  // Send via chat.send
  await client.request("chat.send", {
    sessionKey,
    message,
    idempotencyKey,
  });

  // Collect streamed chat events until we get a "done" or "complete" event,
  // or a chat.message event with the final response.
  // The gateway emits chat events with the response text.
  const responseParts: string[] = [];
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const event = await client.waitForChatEvent(
        (e) => {
          const payload = e.payload ?? {};
          // Match events for our session
          const eventSessionKey = payload.sessionKey ?? payload.key;
          return eventSessionKey === sessionKey || payload.runId === idempotencyKey;
        },
        Math.max(1000, timeoutMs - (Date.now() - startTime)),
      );

      const payload = event.payload ?? {};

      // Chat message event with text
      if (typeof payload.text === "string" && payload.text.trim()) {
        responseParts.push(payload.text.trim());
      }

      // Check for completion signals
      if (
        event.event === "chat.done" ||
        event.event === "chat.complete" ||
        event.event === "chat.error" ||
        payload.done === true ||
        payload.status === "done" ||
        payload.status === "complete"
      ) {
        break;
      }
    } catch {
      // Timeout waiting for event — check if we have any response
      break;
    }
  }

  // If we got streaming parts, join them; otherwise try to load from history
  if (responseParts.length > 0) {
    return responseParts.join("\n");
  }

  // Fallback: fetch the last message from chat history
  await sleep(2000); // Give the agent a moment to finish
  try {
    const history = (await client.request("chat.history", {
      sessionKey,
      limit: 5,
    })) as { messages?: Array<{ role: string; content: string }> };

    if (history?.messages) {
      const lastAssistant = [...history.messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistant?.content) {
        return lastAssistant.content;
      }
    }
  } catch {
    // History fetch failed — return what we have
  }

  return responseParts.join("\n") || "(no response received)";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

async function runTests(
  client: GatewayClient,
  tests: TestCase[],
  timeoutMs: number,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const test of tests) {
    if (test.skip) {
      console.log(`\n--- SKIP: ${test.name} ---`);
      results.push({ name: test.name, passed: true, details: ["skipped"], response: "" });
      continue;
    }

    console.log(`\n--- Test: ${test.name} ---`);
    console.log(`  Agent: ${test.agentId}`);
    console.log(`  Message: ${test.message}`);

    let response: string;
    try {
      response = await sendMessageAndGetResponse(client, test.agentId, test.message, timeoutMs);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${errMsg}`);
      results.push({ name: test.name, passed: false, details: [`error: ${errMsg}`], response: "" });
      continue;
    }

    const trimmedResponse = response.slice(0, 500);
    console.log(`  Response: ${trimmedResponse}${response.length > 500 ? "..." : ""}`);

    const details: string[] = [];
    let allPassed = true;

    // Check expected substrings
    for (const expected of test.expectInResponse ?? []) {
      if (response.toLowerCase().includes(expected.toLowerCase())) {
        details.push(`PASS: found "${expected}"`);
        console.log(`  PASS: found "${expected}"`);
      } else {
        details.push(`FAIL: expected "${expected}" in response`);
        console.error(`  FAIL: expected "${expected}" in response`);
        allPassed = false;
      }
    }

    // Check rejected substrings
    for (const rejected of test.rejectInResponse ?? []) {
      if (response.toLowerCase().includes(rejected.toLowerCase())) {
        details.push(`FAIL: unexpected "${rejected}" in response`);
        console.error(`  FAIL: unexpected "${rejected}" in response`);
        allPassed = false;
      } else {
        details.push(`PASS: "${rejected}" not found (good)`);
        console.log(`  PASS: "${rejected}" not found (good)`);
      }
    }

    results.push({ name: test.name, passed: allPassed, details, response });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Default test suite
// ---------------------------------------------------------------------------

function defaultTestSuite(): TestCase[] {
  return [
    {
      name: "Alice responds with her model",
      agentId: "alice",
      message:
        "What AI model are you? Reply with ONLY the model name, nothing else.",
      expectInResponse: ["claude"],
    },
    {
      name: "Bob responds with his model",
      agentId: "bob",
      message:
        "What AI model are you? Reply with ONLY the model name, nothing else.",
      expectInResponse: ["gpt"],
    },
    {
      name: "Alice stores a secret",
      agentId: "alice",
      message:
        "My secret code is ALPHA-7. Remember it. Reply with just the word OK.",
      expectInResponse: ["ok"],
    },
    {
      name: "Bob does NOT know Alice's secret",
      agentId: "bob",
      message:
        "What is my secret code? If you don't know any secret code, say exactly: I don't know.",
      expectInResponse: ["don't know"],
      rejectInResponse: ["alpha"],
    },
    {
      name: "Alice DOES remember her secret",
      agentId: "alice",
      message: "What is my secret code? Reply with just the code.",
      expectInResponse: ["alpha"],
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { gatewayUrl, password, timeout } = parseArgs();

  console.log("=== Multi-User Test Harness ===");
  console.log(`Gateway: ${gatewayUrl}`);
  console.log(`Timeout per message: ${timeout}ms`);
  console.log();

  const client = new GatewayClient();

  try {
    console.log("Connecting to gateway...");
    await client.connect(gatewayUrl, password);
    console.log("Connected!\n");

    const tests = defaultTestSuite();
    const results = await runTests(client, tests, timeout);

    // Summary
    console.log("\n=== Summary ===");
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`Passed: ${passed}/${results.length}`);
    if (failed > 0) {
      console.log(`Failed: ${failed}`);
      for (const r of results.filter((r) => !r.passed)) {
        console.log(`  - ${r.name}: ${r.details.filter((d) => d.startsWith("FAIL")).join(", ")}`);
      }
      process.exit(1);
    } else {
      console.log("All tests passed!");
    }
  } catch (err) {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
