import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import {
  extraParamsParam,
  offsetParam,
  rowsParam,
  runCall,
  searchengineParam,
} from "./helpers.ts";

/**
 * Daily keyword monitoring (service `monitor`), i.e. the keywords the
 * account actively tracks per project — as opposed to the weekly organic
 * crawl index in tools/keywords.ts. Note: parts of the XOVI docs label these
 * endpoints `keywords/monitor/...`, but the live API only answers on
 * `monitor/...` (anything else 302-redirects to the login page).
 */
export function registerMonitoringTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_monitoring_get_domains",
    "List all domains under daily keyword monitoring. ~10 credits.",
    {},
    async () => runCall(api, "monitor", "getDomains"),
  );

  server.tool(
    "xovi_monitoring_get_keywords",
    "List the monitored keywords of a project (daily tracking) with their current positions. Paginated. ~20 credits/100 rows.",
    {
      projectId: z.union([z.string(), z.number()]).describe("XOVI project ID (see xovi_list_projects)."),
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "monitor", "getKeywords", params),
  );

  server.tool(
    "xovi_monitoring_get_keyword_rankings",
    "Get the current SERP rankings for one monitored keyword. ~25 credits.",
    {
      keywordId: z.union([z.string(), z.number()]).describe("Monitoring keyword ID (see xovi_monitoring_get_keywords)."),
    },
    async (params) => runCall(api, "monitor", "getKeywordRankings", params),
  );

  server.tool(
    "xovi_monitoring_get_keyword_trend",
    "Get the daily position history of one monitored keyword. ~15 credits.",
    {
      keywordId: z.union([z.string(), z.number()]).describe("Monitoring keyword ID (see xovi_monitoring_get_keywords)."),
    },
    async (params) => runCall(api, "monitor", "getKeywordTrend", params),
  );

  server.tool(
    "xovi_monitoring_get_ovi_trend",
    "Get the OVI (visibility) history of a monitored project. ~5 credits/row.",
    {
      projectId: z.union([z.string(), z.number()]).describe("XOVI project ID (see xovi_list_projects)."),
    },
    async (params) => runCall(api, "monitor", "getOviTrend", params),
  );

  server.tool(
    "xovi_monitoring_get_limits",
    "Get the monitoring keyword limits (used vs. available tracked keywords). Free — costs no credits. Always check this before adding keywords.",
    {},
    async () => runCall(api, "monitor", "getKeywordLimits"),
  );

  server.tool(
    "xovi_monitoring_add_keywords",
    "Add keywords to the daily monitoring of a project. Write operation — each keyword consumes monitoring quota and causes recurring daily credit load. Check xovi_monitoring_get_limits first. ~20 credits.",
    {
      projectId: z.union([z.string(), z.number()]).describe("XOVI project ID (see xovi_list_projects)."),
      searchengine: searchengineParam,
      keywords: z.string().min(1).describe("Comma-separated list of keywords to add."),
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "addKeywords", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_edit_keywords",
    "Edit a monitored keyword (endpoint-specific parameters via extra_params). Write operation. ~10 credits.",
    {
      keywordId: z.union([z.string(), z.number()]).describe("Monitoring keyword ID to edit."),
      extra_params: extraParamsParam,
    },
    async ({ keywordId, extra_params }) =>
      runCall(api, "monitor", "editKeywords", { keywordId, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_delete_keywords",
    "DESTRUCTIVE: Remove a keyword from monitoring — its daily tracking history stops. Cannot be undone — confirm with the user before calling. ~10 credits.",
    {
      keywordId: z.union([z.string(), z.number()]).describe("Monitoring keyword ID to delete."),
    },
    async (params) => runCall(api, "monitor", "deleteKeywords", params),
  );
}
