import { describe, it, expect } from "vitest";
import { parseIdentifier, parseAllIdentifiers } from "./identifiers.ts";

describe("parseIdentifier", () => {
  it("parses E164 phone numbers into WhatsApp + Signal entries", () => {
    const result = parseIdentifier("+1234567890");
    expect(result).toEqual([
      { channel: "whatsapp", peerId: "+1234567890" },
      { channel: "signal", peerId: "+1234567890" },
    ]);
  });

  it("parses long E164 phone numbers", () => {
    const result = parseIdentifier("+447911123456");
    expect(result).toEqual([
      { channel: "whatsapp", peerId: "+447911123456" },
      { channel: "signal", peerId: "+447911123456" },
    ]);
  });

  it("parses telegram: prefix", () => {
    const result = parseIdentifier("telegram:alice_handle");
    expect(result).toEqual([{ channel: "telegram", peerId: "alice_handle" }]);
  });

  it("parses discord: prefix", () => {
    const result = parseIdentifier("discord:123456789");
    expect(result).toEqual([{ channel: "discord", peerId: "123456789" }]);
  });

  it("parses slack: prefix", () => {
    const result = parseIdentifier("slack:U012345");
    expect(result).toEqual([{ channel: "slack", peerId: "U012345" }]);
  });

  it("parses signal: prefix (UUID, not phone)", () => {
    const result = parseIdentifier("signal:abc-def-ghi");
    expect(result).toEqual([{ channel: "signal", peerId: "abc-def-ghi" }]);
  });

  it("parses web: prefix", () => {
    const result = parseIdentifier("web:user123");
    expect(result).toEqual([{ channel: "web", peerId: "user123" }]);
  });

  it("parses matrix: prefix", () => {
    const result = parseIdentifier("matrix:@alice:matrix.org");
    expect(result).toEqual([{ channel: "matrix", peerId: "@alice:matrix.org" }]);
  });

  it("parses whatsapp: prefix", () => {
    const result = parseIdentifier("whatsapp:+5512345678");
    expect(result).toEqual([{ channel: "whatsapp", peerId: "+5512345678" }]);
  });

  it("is case-insensitive for prefixes", () => {
    const result = parseIdentifier("Telegram:alice");
    expect(result).toEqual([{ channel: "telegram", peerId: "alice" }]);
  });

  it("trims whitespace", () => {
    const result = parseIdentifier("  telegram:alice  ");
    expect(result).toEqual([{ channel: "telegram", peerId: "alice" }]);
  });

  it("throws on empty identifier", () => {
    expect(() => parseIdentifier("")).toThrow(/Empty identifier/);
    expect(() => parseIdentifier("   ")).toThrow(/Empty identifier/);
  });

  it("throws on invalid E164 (too short)", () => {
    expect(() => parseIdentifier("+123")).toThrow(/Invalid E164/);
  });

  it("throws on invalid E164 (non-digit characters)", () => {
    expect(() => parseIdentifier("+12345abc90")).toThrow(/Invalid E164/);
  });

  it("throws on unknown channel prefix", () => {
    expect(() => parseIdentifier("foobar:value")).toThrow(/Unknown channel prefix/);
  });

  it("throws on empty value after prefix", () => {
    expect(() => parseIdentifier("telegram:")).toThrow(/Empty value/);
  });

  it("throws on unrecognized format (no prefix, no phone)", () => {
    expect(() => parseIdentifier("just-a-string")).toThrow(/Unrecognized identifier format/);
  });
});

describe("parseAllIdentifiers", () => {
  it("parses multiple identifiers", () => {
    const result = parseAllIdentifiers([
      "+1234567890",
      "telegram:alice",
      "discord:12345",
    ]);
    expect(result).toEqual([
      { channel: "whatsapp", peerId: "+1234567890" },
      { channel: "signal", peerId: "+1234567890" },
      { channel: "telegram", peerId: "alice" },
      { channel: "discord", peerId: "12345" },
    ]);
  });

  it("deduplicates identical entries", () => {
    const result = parseAllIdentifiers([
      "+1234567890",
      "whatsapp:+1234567890",
    ]);
    expect(result).toEqual([
      { channel: "whatsapp", peerId: "+1234567890" },
      { channel: "signal", peerId: "+1234567890" },
    ]);
  });

  it("returns empty array for empty input", () => {
    const result = parseAllIdentifiers([]);
    expect(result).toEqual([]);
  });
});
