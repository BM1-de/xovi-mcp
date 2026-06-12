import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, DEFAULT_BASE_URL } from "../src/config.ts";

test("loadConfig throws without XOVI_KEY", () => {
  assert.throws(() => loadConfig({}), /XOVI_KEY/);
});

test("loadConfig throws on empty/whitespace XOVI_KEY", () => {
  assert.throws(() => loadConfig({ XOVI_KEY: "   " }), /XOVI_KEY/);
});

test("loadConfig returns trimmed key and default base URL", () => {
  const config = loadConfig({ XOVI_KEY: "  abc123  " });
  assert.equal(config.xoviKey, "abc123");
  assert.equal(config.baseUrl, DEFAULT_BASE_URL);
});

test("loadConfig strips trailing slashes from XOVI_BASE_URL", () => {
  const config = loadConfig({
    XOVI_KEY: "abc123",
    XOVI_BASE_URL: "https://example.com/api///",
  });
  assert.equal(config.baseUrl, "https://example.com/api");
});
