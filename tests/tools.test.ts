import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { XoviApi, XoviResponse, ParamValue } from "../src/api-client.ts";
import { registerUserTools } from "../src/tools/user.ts";
import { registerProjectTools } from "../src/tools/project.ts";
import { registerKeywordTools } from "../src/tools/keywords.ts";
import { registerMonitoringTools } from "../src/tools/monitoring.ts";
import { registerLinkTools } from "../src/tools/links.ts";
import { registerSeaTools } from "../src/tools/sea.ts";
import { registerReportTools } from "../src/tools/report.ts";
import { registerAddressbookTools } from "../src/tools/addressbook.ts";
import { registerGenericTools } from "../src/tools/generic.ts";

const EXPECTED_TOOLS = [
  // user
  "xovi_get_credit_state",
  "xovi_get_limits",
  "xovi_get_subaccounts",
  // project
  "xovi_list_projects",
  "xovi_list_labels",
  "xovi_list_categories",
  "xovi_add_project",
  "xovi_add_label",
  "xovi_edit_label",
  "xovi_delete_label",
  // keywords
  "xovi_get_search_engines",
  "xovi_get_keywords",
  "xovi_get_keyword_rankings",
  "xovi_get_keyword_trend",
  "xovi_get_ranking_trend",
  "xovi_get_ranking_value",
  "xovi_get_ovi_trend",
  "xovi_get_top_domains",
  "xovi_get_ranking_column",
  "xovi_get_new_keywords",
  "xovi_get_lost_keywords",
  "xovi_get_pages",
  // monitoring
  "xovi_monitoring_get_domains",
  "xovi_monitoring_get_keywords",
  "xovi_monitoring_get_keyword_rankings",
  "xovi_monitoring_get_keyword_trend",
  "xovi_monitoring_get_ovi_trend",
  "xovi_monitoring_get_limits",
  "xovi_monitoring_add_keywords",
  "xovi_monitoring_edit_keywords",
  "xovi_monitoring_delete_keywords",
  // links
  "xovi_get_backlink_trend",
  "xovi_get_backlinks",
  "xovi_get_linktexts",
  "xovi_get_hrefs",
  "xovi_get_linked_pages",
  // sea
  "xovi_sea_get_keywords",
  // report
  "xovi_list_reports",
  "xovi_get_report_pdf",
  // addressbook
  "xovi_addressbook_get_organisations",
  "xovi_addressbook_get_persons",
  "xovi_addressbook_add_organisation",
  "xovi_addressbook_add_person",
  "xovi_addressbook_edit_organisation",
  "xovi_addressbook_edit_person",
  "xovi_addressbook_delete_organisation",
  "xovi_addressbook_delete_person",
  // generic
  "xovi_api_call",
].sort();

interface RecordedCall {
  service: string;
  method: string;
  params: Record<string, ParamValue>;
}

async function setup(
  impl?: (service: string, method: string, params: Record<string, ParamValue>) => XoviResponse,
) {
  const calls: RecordedCall[] = [];
  const api: XoviApi = {
    async call(service, method, params = {}) {
      calls.push({ service, method, params });
      if (impl) return impl(service, method, params);
      return { ok: true, data: { hello: "world" } };
    },
  };

  const server = new McpServer({ name: "xovi-mcp-test", version: "0.0.0" });
  registerUserTools(server, api);
  registerProjectTools(server, api);
  registerKeywordTools(server, api);
  registerMonitoringTools(server, api);
  registerLinkTools(server, api);
  registerSeaTools(server, api);
  registerReportTools(server, api);
  registerAddressbookTools(server, api);
  registerGenericTools(server, api);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, calls };
}

function payloadOf(result: { content?: unknown }) {
  const content = result.content as { type: string; text: string }[];
  assert.ok(Array.isArray(content) && content.length > 0, "tool returned no content");
  return JSON.parse(content[0].text);
}

test("all 48 tools from the spec are registered", async () => {
  const { client } = await setup();
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, EXPECTED_TOOLS);
});

test("destructive tools carry an explicit warning in their description", async () => {
  const { client } = await setup();
  const { tools } = await client.listTools();
  const destructive = tools.filter((tool) => tool.name.includes("delete"));
  assert.equal(destructive.length, 4);
  for (const tool of destructive) {
    assert.match(tool.description ?? "", /DESTRUCTIVE/, `${tool.name} must be marked DESTRUCTIVE`);
  }
});

test("xovi_get_credit_state calls user/getCreditstate and returns ok payload", async () => {
  const { client, calls } = await setup(() => ({ ok: true, data: { creditsLeft: 999 } }));
  const result = await client.callTool({ name: "xovi_get_credit_state", arguments: {} });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].service, "user");
  assert.equal(calls[0].method, "getCreditstate");
  const payload = payloadOf(result);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.data, { creditsLeft: 999 });
});

test("xovi_get_keywords applies defaults (sengine 1, offset 0, rows 100)", async () => {
  const { client, calls } = await setup();
  await client.callTool({
    name: "xovi_get_keywords",
    arguments: { urlpattern: "www.example.com" },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, {
    urlpattern: "www.example.com",
    sengine: 1,
    offset: 0,
    rows: 100,
  });
});

test("links tools send domain (live-verified param name)", async () => {
  const { client, calls } = await setup();
  await client.callTool({
    name: "xovi_get_backlinks",
    arguments: { domain: "www.example.com" },
  });
  assert.equal(calls[0].service, "links");
  assert.equal(calls[0].method, "getBacklinks");
  assert.deepEqual(calls[0].params, { domain: "www.example.com", offset: 0, rows: 100 });
});

test("monitoring tools call the monitor service (not keywords/monitor)", async () => {
  const { client, calls } = await setup();
  await client.callTool({ name: "xovi_monitoring_get_limits", arguments: {} });
  assert.equal(calls[0].service, "monitor");
  assert.equal(calls[0].method, "getKeywordLimits");
});

test("API error surfaces as tool error with code and paramname", async () => {
  const { client } = await setup(() => ({
    ok: false,
    data: null,
    errorCode: 80,
    errorMessage: "param missing",
    paramname: "urlpattern",
  }));
  const result = await client.callTool({
    name: "xovi_get_ovi_trend",
    arguments: { urlpattern: "www.example.com" },
  });
  assert.equal(result.isError, true);
  const payload = payloadOf(result);
  assert.equal(payload.ok, false);
  assert.equal(payload.errorCode, 80);
  assert.equal(payload.error, "param missing");
  assert.equal(payload.paramname, "urlpattern");
});

test("credits and totalRows are passed through to the payload", async () => {
  const { client } = await setup(() => ({
    ok: true,
    data: [{ keyword: "seo" }],
    credits: 25,
    totalRows: 1234,
  }));
  const result = await client.callTool({
    name: "xovi_get_keywords",
    arguments: { urlpattern: "www.example.com" },
  });
  const payload = payloadOf(result);
  assert.equal(payload.creditsUsed, 25);
  assert.equal(payload.totalRows, 1234);
  assert.deepEqual(payload.data, [{ keyword: "seo" }]);
});

test("thrown client errors come back masked as tool errors", async () => {
  const { client } = await setup(() => {
    throw new Error("network fail at https://x/api/foo?key=topSecret123&format=json");
  });
  const result = await client.callTool({ name: "xovi_list_projects", arguments: {} });
  assert.equal(result.isError, true);
  const payload = payloadOf(result);
  assert.equal(payload.ok, false);
  assert.ok(!payload.error.includes("topSecret123"));
  assert.ok(payload.error.includes("key=***"));
});

test("xovi_api_call passes service, method and params through", async () => {
  const { client, calls } = await setup();
  await client.callTool({
    name: "xovi_api_call",
    arguments: {
      service: "keywords",
      method: "monitor/getOviTrend",
      params: { projectId: 42, verbose: true },
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].service, "keywords");
  assert.equal(calls[0].method, "monitor/getOviTrend");
  assert.deepEqual(calls[0].params, { projectId: 42, verbose: true });
});

test("write tools merge extra_params into the query", async () => {
  const { client, calls } = await setup();
  await client.callTool({
    name: "xovi_monitoring_add_keywords",
    arguments: {
      projhash: "8149c8eb6b10bb49455b0af9be4503d9",
      keywords: "seo agentur,seo beratung",
      extra_params: { device: "mobile" },
    },
  });
  assert.deepEqual(calls[0].params, {
    projhash: "8149c8eb6b10bb49455b0af9be4503d9",
    sengineid: 1,
    keywords: "seo agentur,seo beratung",
    device: "mobile",
  });
});
