import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Readable, Writable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { normalizePhone, verifyApiKey, safeCompare, readBody } from "./index.js";

// ---------------------------------------------------------------------------
// Helpers to build mock HTTP req/res for handler tests
// ---------------------------------------------------------------------------

function mockReq(opts: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): IncomingMessage {
  const readable = new Readable();
  readable._read = () => {};
  Object.assign(readable, {
    method: opts.method ?? "GET",
    url: opts.url ?? "/",
    headers: opts.headers ?? {},
  });
  if (opts.body !== undefined) {
    const json = JSON.stringify(opts.body);
    process.nextTick(() => {
      readable.push(json);
      readable.push(null);
    });
  } else {
    process.nextTick(() => readable.push(null));
  }
  return readable as unknown as IncomingMessage;
}

type MockRes = ServerResponse & {
  _status: number;
  _headers: Record<string, string>;
  _body: string;
  json(): unknown;
};

function mockRes(): MockRes {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });
  const res = Object.assign(writable, {
    statusCode: 200,
    _status: 200,
    _headers: {} as Record<string, string>,
    _body: "",
    setHeader(name: string, value: string) {
      res._headers[name.toLowerCase()] = value;
    },
    end(data?: string | Buffer) {
      if (data) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      res._body = Buffer.concat(chunks).toString("utf-8");
      res._status = res.statusCode;
    },
    json() {
      return JSON.parse(res._body);
    },
  });
  return res as unknown as MockRes;
}

// ---------------------------------------------------------------------------
// Mock for the plugin API — captures registered handlers
// ---------------------------------------------------------------------------

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

function createMockApi(config?: { apiKey?: string; agentId?: string }) {
  const routes = new Map<string, RouteHandler>();
  const mockSendWhatsApp = vi.fn().mockResolvedValue({ messageId: "mock-id", toJid: "mock-jid" });
  return {
    routes,
    mockSendWhatsApp,
    api: {
      pluginConfig: config ?? {},
      config: {},
      runtime: {
        channel: {
          whatsapp: {
            sendMessageWhatsApp: mockSendWhatsApp,
          },
        },
      },
      logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
      registerHttpRoute: ({ path, handler }: { path: string; handler: RouteHandler }) => {
        routes.set(path, handler);
      },
    },
  };
}

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------

describe("normalizePhone", () => {
  it("strips non-digits and adds + prefix", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("handles raw digits", () => {
    expect(normalizePhone("15551234567")).toBe("+15551234567");
  });

  it("handles already-normalized input", () => {
    expect(normalizePhone("+15551234567")).toBe("+15551234567");
  });

  it("handles international formats", () => {
    expect(normalizePhone("+44 7911 123456")).toBe("+447911123456");
  });

  it("handles empty string", () => {
    expect(normalizePhone("")).toBe("+");
  });
});

// ---------------------------------------------------------------------------
// verifyApiKey
// ---------------------------------------------------------------------------

describe("verifyApiKey", () => {
  const key = "test-api-key-12345";

  it("returns true for valid bearer token", () => {
    const req = mockReq({ headers: { authorization: `Bearer ${key}` } });
    expect(verifyApiKey(req, key)).toBe(true);
  });

  it("returns false for missing authorization header", () => {
    const req = mockReq({ headers: {} });
    expect(verifyApiKey(req, key)).toBe(false);
  });

  it("returns false for wrong token", () => {
    const req = mockReq({ headers: { authorization: "Bearer wrong-key-xxxxxxx" } });
    expect(verifyApiKey(req, key)).toBe(false);
  });

  it("returns false for non-bearer auth", () => {
    const req = mockReq({ headers: { authorization: `Basic ${key}` } });
    expect(verifyApiKey(req, key)).toBe(false);
  });

  it("returns false for token with different length", () => {
    const req = mockReq({ headers: { authorization: "Bearer short" } });
    expect(verifyApiKey(req, key)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// safeCompare
// ---------------------------------------------------------------------------

describe("safeCompare", () => {
  it("returns true for matching strings", () => {
    expect(safeCompare("123456", "123456")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeCompare("123456", "654321")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(safeCompare("123", "123456")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    expect(safeCompare("", "123456")).toBe(false);
  });

  it("returns true for empty vs empty", () => {
    expect(safeCompare("", "")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// readBody
// ---------------------------------------------------------------------------

describe("readBody", () => {
  it("parses valid JSON body", async () => {
    const req = mockReq({ body: { phone: "+15551234567" } });
    const result = await readBody(req);
    expect(result).toEqual({ phone: "+15551234567" });
  });

  it("rejects on invalid JSON", async () => {
    const readable = new Readable();
    readable._read = () => {};
    Object.assign(readable, { method: "POST", url: "/", headers: {} });
    process.nextTick(() => {
      readable.push("not json");
      readable.push(null);
    });
    await expect(readBody(readable as unknown as IncomingMessage)).rejects.toThrow("Invalid JSON");
  });
});

// ---------------------------------------------------------------------------
// Handler tests: GET /loglife/sessions
// ---------------------------------------------------------------------------

describe("GET /loglife/sessions handler", () => {
  const API_KEY = "test-key-abcdef";

  const sessionsData = {
    "whatsapp:15551234567@s.whatsapp.net": {
      sessionId: "uuid-1234",
      updatedAt: 1700000000000,
      abortedLastRun: false,
      chatType: "dm",
      lastChannel: "whatsapp",
      origin: { label: "Test User", from: "+15551234567", to: "+19999999999" },
      deliveryContext: { channel: "whatsapp", to: "+15551234567" },
      compactionCount: 2,
      inputTokens: 500,
      outputTokens: 300,
      totalTokens: 800,
      model: "gpt-4o",
    },
  };

  let handler: RouteHandler;

  beforeEach(async () => {
    vi.doMock("node:fs/promises", () => ({
      readFile: vi.fn().mockResolvedValue(JSON.stringify(sessionsData)),
    }));
    const mod = await import("./index.js");
    const { routes, api } = createMockApi({ apiKey: API_KEY });
    mod.default.register(api as never);
    handler = routes.get("/loglife/sessions")!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 401 without auth", async () => {
    const req = mockReq({ method: "GET", url: "/loglife/sessions?phone=123" });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it("returns 405 for non-GET methods", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/sessions?phone=123",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it("returns 400 when no query params provided", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/sessions",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Provide ?sessionId=, ?key=, or ?phone=" });
  });

  it("finds session by phone number", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/sessions?phone=%2B15551234567",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.sessionId).toBe("uuid-1234");
    expect((body.origin as Record<string, string>).from).toBe("+15551234567");
    expect(body.model).toBe("gpt-4o");
  });

  it("finds session by sessionId", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/sessions?sessionId=uuid-1234",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect((res.json() as Record<string, unknown>).sessionId).toBe("uuid-1234");
  });

  it("finds session by key", async () => {
    const req = mockReq({
      method: "GET",
      url: `/loglife/sessions?key=${encodeURIComponent("whatsapp:15551234567@s.whatsapp.net")}`,
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect((res.json() as Record<string, unknown>).sessionId).toBe("uuid-1234");
  });

  it("returns 404 for non-existent session", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/sessions?phone=%2B10000000000",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Handler tests: POST /loglife/verify/check
// ---------------------------------------------------------------------------

describe("POST /loglife/verify/check handler", () => {
  const API_KEY = "verify-test-key";

  let checkHandler: RouteHandler;
  let mockSendWA: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./index.js");
    const mock = createMockApi({ apiKey: API_KEY });
    mockSendWA = mock.mockSendWhatsApp;
    mod.default.register(mock.api as never);
    checkHandler = mock.routes.get("/loglife/verify/check")!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 401 without auth", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/check",
      body: { phone: "+15551234567", code: "123456" },
    });
    const res = mockRes();
    await checkHandler(req, res);
    expect(res._status).toBe(401);
  });

  it("returns 400 when phone is missing", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/check",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { code: "123456" },
    });
    const res = mockRes();
    await checkHandler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Missing required field: phone" });
  });

  it("returns 400 when code is missing", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/check",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "+15551234567" },
    });
    const res = mockRes();
    await checkHandler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Missing required field: code" });
  });

  it("returns verified:true and triggers welcome message for valid code", async () => {
    const { verificationCodes } = await import("./index.js");
    const phone = "+15559999999";
    verificationCodes.set(phone, {
      code: "123456",
      expiresAt: Date.now() + 300_000,
      sentAt: Date.now() - 10_000,
    });

    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/check",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone, code: "123456" },
    });
    const res = mockRes();
    await checkHandler(req, res);

    expect(res._status).toBe(200);
    expect((res.json() as Record<string, unknown>).verified).toBe(true);

    await new Promise((r) => setTimeout(r, 50));
    expect(mockSendWA).toHaveBeenCalledWith(
      phone,
      expect.stringContaining("Welcome to LogLife"),
      { verbose: false },
    );
  });

  it("returns verified:false for code that was never sent", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/check",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "+15551234567", code: "123456" },
    });
    const res = mockRes();
    await checkHandler(req, res);
    expect(res._status).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.verified).toBe(false);
  });

  it("returns 405 for GET method", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/verify/check",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await checkHandler(req, res);
    expect(res._status).toBe(405);
  });
});

// ---------------------------------------------------------------------------
// Handler tests: POST /loglife/verify/send
// ---------------------------------------------------------------------------

describe("POST /loglife/verify/send handler", () => {
  const API_KEY = "send-test-key-x";

  let sendHandler: RouteHandler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./index.js");
    const { routes, api } = createMockApi({ apiKey: API_KEY });
    mod.default.register(api as never);
    sendHandler = routes.get("/loglife/verify/send")!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 401 without auth", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/send",
      body: { phone: "+15551234567" },
    });
    const res = mockRes();
    await sendHandler(req, res);
    expect(res._status).toBe(401);
  });

  it("returns 400 when phone is missing", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/send",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: {},
    });
    const res = mockRes();
    await sendHandler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Missing required field: phone" });
  });

  it("returns 400 for invalid (too short) phone number", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/verify/send",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "12" },
    });
    const res = mockRes();
    await sendHandler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Invalid phone number" });
  });

  it("returns 405 for GET method", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/verify/send",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await sendHandler(req, res);
    expect(res._status).toBe(405);
  });
});

// ---------------------------------------------------------------------------
// Handler tests: POST /loglife/register
// ---------------------------------------------------------------------------

describe("POST /loglife/register handler", () => {
  const API_KEY = "register-test-key";

  let registerHandler: RouteHandler;
  let mockWriteFileSync: ReturnType<typeof vi.fn>;
  let mockUtimesSync: ReturnType<typeof vi.fn>;
  let usersJsonContent: string;

  beforeEach(async () => {
    vi.resetModules();

    usersJsonContent = JSON.stringify({
      users: [],
      defaults: { dmScope: "main" },
    });

    mockWriteFileSync = vi.fn();
    mockUtimesSync = vi.fn();

    vi.doMock("node:fs", () => ({
      readFileSync: vi.fn().mockImplementation(() => usersJsonContent),
      writeFileSync: mockWriteFileSync,
      existsSync: vi.fn().mockReturnValue(true),
      utimesSync: mockUtimesSync,
    }));

    vi.doMock("node:fs/promises", () => ({
      readFile: vi.fn().mockResolvedValue("{}"),
      writeFile: vi.fn().mockResolvedValue(undefined),
    }));

    const mod = await import("./index.js");
    const { routes, api } = createMockApi({ apiKey: API_KEY });
    mod.default.register(api as never);
    registerHandler = routes.get("/loglife/register")!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 401 without auth", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/register",
      body: { phone: "+15551234567" },
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(401);
  });

  it("returns 405 for GET method", async () => {
    const req = mockReq({
      method: "GET",
      url: "/loglife/register",
      headers: { authorization: `Bearer ${API_KEY}` },
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(405);
  });

  it("returns 400 when phone is missing", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/register",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: {},
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Missing required field: phone" });
  });

  it("returns 400 for invalid (too short) phone number", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/register",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "12" },
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(400);
    expect(res.json()).toEqual({ error: "Invalid phone number" });
  });

  it("registers a new user and writes config", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/register",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "+15551234567", name: "Alice" },
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.registered).toBe(true);
    expect(body.userId).toBeDefined();

    // Verify users.json and generated.json were written
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
    // Verify openclaw.json was touched for hot-reload
    expect(mockUtimesSync).toHaveBeenCalledTimes(1);
  });

  it("uses name to derive user ID", async () => {
    const req = mockReq({
      method: "POST",
      url: "/loglife/register",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "+15551234567", name: "Alice Smith" },
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.userId).toBe("alice-smith");
  });

  it("returns existing:true for duplicate phone", async () => {
    usersJsonContent = JSON.stringify({
      users: [{ id: "alice", identifiers: ["+15551234567"] }],
      defaults: { dmScope: "main" },
    });

    const req = mockReq({
      method: "POST",
      url: "/loglife/register",
      headers: { authorization: `Bearer ${API_KEY}` },
      body: { phone: "+15551234567" },
    });
    const res = mockRes();
    await registerHandler(req, res);
    expect(res._status).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.registered).toBe(true);
    expect(body.existing).toBe(true);

    // Should NOT write files for existing user
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});
