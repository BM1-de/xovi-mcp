import { test } from "node:test";
import assert from "node:assert/strict";
import { maskKey, normalizeResponse, XoviClient, XoviError } from "../src/api-client.ts";

const KEY = "sup3rS3cretKey";
const BASE = "https://suite.example.test/api";

// --- maskKey ---------------------------------------------------------------

test("maskKey replaces the key value everywhere", () => {
  const input = `error at https://x/api/user/getCreditstate?key=${KEY}&format=json and again ${KEY}`;
  const out = maskKey(input, KEY);
  assert.ok(!out.includes(KEY));
  assert.ok(out.includes("key=***"));
  assert.ok(out.includes("and again ***"));
});

test("maskKey masks key= query params generically without knowing the value", () => {
  const out = maskKey("GET https://x/api/foo?bar=1&key=someOtherKey123&format=json");
  assert.ok(!out.includes("someOtherKey123"));
  assert.ok(out.includes("key=***"));
  assert.ok(out.includes("bar=1"));
});

test("maskKey leaves unrelated text untouched", () => {
  assert.equal(maskKey("plain message", KEY), "plain message");
});

// --- normalizeResponse: envelope A (apiErrorCode/apiResult) -----------------

test("normalize envelope A: success", () => {
  const res = normalizeResponse({
    apiErrorCode: 0,
    apiErrorMessage: "0k.",
    apiResult: { creditsLeft: 1000 },
  });
  assert.equal(res.ok, true);
  assert.deepEqual(res.data, { creditsLeft: 1000 });
  assert.equal(res.errorCode, undefined);
});

test("normalize envelope A: numeric string error code", () => {
  const res = normalizeResponse({ apiErrorCode: "0", apiResult: [] });
  assert.equal(res.ok, true);
});

test("normalize envelope A: error with paramname", () => {
  const res = normalizeResponse({
    apiErrorCode: 80,
    apiErrorMessage: "param missing",
    paramname: "urlpattern",
  });
  assert.equal(res.ok, false);
  assert.equal(res.errorCode, 80);
  assert.equal(res.errorMessage, "param missing");
  assert.equal(res.paramname, "urlpattern");
});

// --- normalizeResponse: envelope B (request/response) -----------------------

test("normalize envelope B: success with items, credits, totalRows", () => {
  const res = normalizeResponse({
    request: { service: "keywords", method: "getKeywords" },
    response: {
      status: "ok",
      code: 0,
      credits: 25,
      items: [{ keyword: "seo" }],
      totalRows: 1234,
    },
  });
  assert.equal(res.ok, true);
  assert.deepEqual(res.data, [{ keyword: "seo" }]);
  assert.equal(res.credits, 25);
  assert.equal(res.totalRows, 1234);
});

test("normalize envelope B: success without items keeps remaining fields", () => {
  const res = normalizeResponse({
    response: { status: "ok", credits: 1, monitoringLimit: 500, used: 100 },
  });
  assert.equal(res.ok, true);
  assert.deepEqual(res.data, { monitoringLimit: 500, used: 100 });
  assert.equal(res.credits, 1);
});

test("normalize envelope B: error with paramname", () => {
  const res = normalizeResponse({
    response: { status: "error", code: 80, message: "param missing", paramname: "keyword" },
  });
  assert.equal(res.ok, false);
  assert.equal(res.errorCode, 80);
  assert.equal(res.errorMessage, "param missing");
  assert.equal(res.paramname, "keyword");
});

// --- normalizeResponse: unknown shapes pass through --------------------------

test("normalize passes through plain arrays", () => {
  const res = normalizeResponse([1, 2, 3]);
  assert.equal(res.ok, true);
  assert.deepEqual(res.data, [1, 2, 3]);
});

test("normalize passes through objects in neither envelope", () => {
  const res = normalizeResponse({ some: "thing" });
  assert.equal(res.ok, true);
  assert.deepEqual(res.data, { some: "thing" });
});

// --- XoviClient (fetch mocked) ----------------------------------------------

function mockFetch(t: { after: (fn: () => void) => void }, impl: typeof fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  t.after(() => {
    globalThis.fetch = original;
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("client builds URL with query params, key and format=json", async (t) => {
  let captured = "";
  mockFetch(t, (async (url: RequestInfo | URL) => {
    captured = String(url);
    return jsonResponse({ apiErrorCode: 0, apiResult: [] });
  }) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await client.call("keywords", "getKeywords", {
    urlpattern: "www.example.com",
    searchengine: 1,
    offset: 0,
    rows: 100,
    skipped: undefined,
  });

  const url = new URL(captured);
  assert.equal(url.pathname, "/api/keywords/getKeywords");
  assert.equal(url.searchParams.get("urlpattern"), "www.example.com");
  assert.equal(url.searchParams.get("searchengine"), "1");
  assert.equal(url.searchParams.get("offset"), "0");
  assert.equal(url.searchParams.get("rows"), "100");
  assert.equal(url.searchParams.get("key"), KEY);
  assert.equal(url.searchParams.get("format"), "json");
  assert.equal(url.searchParams.has("skipped"), false);
});

test("client URL-encodes special characters in params", async (t) => {
  let captured = "";
  mockFetch(t, (async (url: RequestInfo | URL) => {
    captured = String(url);
    return jsonResponse({ apiErrorCode: 0, apiResult: [] });
  }) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await client.call("keywords", "getKeywordRankings", { keyword: "küchen & möbel = top" });

  assert.ok(captured.includes("k%C3%BCchen"));
  const url = new URL(captured);
  assert.equal(url.searchParams.get("keyword"), "küchen & möbel = top");
});

test("client params cannot override key or format", async (t) => {
  let captured = "";
  mockFetch(t, (async (url: RequestInfo | URL) => {
    captured = String(url);
    return jsonResponse({ apiErrorCode: 0, apiResult: [] });
  }) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await client.call("user", "getCreditstate", { key: "EVIL", format: "xml" });

  const url = new URL(captured);
  assert.equal(url.searchParams.get("key"), KEY);
  assert.equal(url.searchParams.get("format"), "json");
});

test("client supports sub-path methods (keywords monitor)", async (t) => {
  let captured = "";
  mockFetch(t, (async (url: RequestInfo | URL) => {
    captured = String(url);
    return jsonResponse({ apiErrorCode: 0, apiResult: [] });
  }) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await client.call("keywords", "monitor/getDomains");

  assert.ok(captured.startsWith(`${BASE}/keywords/monitor/getDomains?`));
});

test("client throws a clear masked error on 302 redirect", async (t) => {
  mockFetch(t, (async () =>
    new Response(null, {
      status: 302,
      headers: { location: `https://suite.example.test/login?back=key%3D${KEY}` },
    })) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await assert.rejects(
    () => client.call("user", "getCreditstate"),
    (err: unknown) => {
      assert.ok(err instanceof XoviError);
      assert.match(err.message, /redirect/i);
      assert.match(err.message, /key/i);
      assert.ok(!err.message.includes(KEY));
      return true;
    },
  );
});

test("client masks the key in HTTP error bodies", async (t) => {
  mockFetch(t, (async () =>
    new Response(`Internal error while processing key=${KEY}`, { status: 500 })) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await assert.rejects(
    () => client.call("user", "getCreditstate"),
    (err: unknown) => {
      assert.ok(err instanceof XoviError);
      assert.match(err.message, /HTTP 500/);
      assert.ok(!err.message.includes(KEY));
      assert.ok(err.message.includes("key=***"));
      return true;
    },
  );
});

test("client throws masked error on non-JSON response", async (t) => {
  mockFetch(t, (async () =>
    new Response(`<html><body>Login key=${KEY}</body></html>`, {
      status: 200,
      headers: { "content-type": "text/html" },
    })) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await assert.rejects(
    () => client.call("user", "getCreditstate"),
    (err: unknown) => {
      assert.ok(err instanceof XoviError);
      assert.match(err.message, /non-JSON/);
      assert.match(err.message, /text\/html/);
      assert.ok(!err.message.includes(KEY));
      return true;
    },
  );
});

test("client masks the key in network errors", async (t) => {
  mockFetch(t, (async () => {
    throw new Error(`connect ETIMEDOUT for ${BASE}/user/getCreditstate?key=${KEY}&format=json`);
  }) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  await assert.rejects(
    () => client.call("user", "getCreditstate"),
    (err: unknown) => {
      assert.ok(err instanceof XoviError);
      assert.match(err.message, /Network error/);
      assert.ok(!err.message.includes(KEY));
      return true;
    },
  );
});

test("client returns the normalised response on success", async (t) => {
  mockFetch(t, (async () =>
    jsonResponse({
      response: { status: "ok", credits: 5, items: [{ id: 1 }], totalRows: 1 },
    })) as typeof fetch);

  const client = new XoviClient(KEY, BASE);
  const res = await client.call("project", "getProjects");
  assert.equal(res.ok, true);
  assert.equal(res.credits, 5);
  assert.equal(res.totalRows, 1);
  assert.deepEqual(res.data, [{ id: 1 }]);
});
