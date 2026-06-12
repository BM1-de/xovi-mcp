import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import {
  domainParam,
  extraParamsParam,
  offsetParam,
  rowsParam,
  runCall,
  sengineidParam,
} from "./helpers.ts";

/**
 * Daily keyword monitoring (service `monitor`), i.e. the keywords the
 * account actively tracks per project — as opposed to the weekly organic
 * crawl index in tools/keywords.ts.
 *
 * Live-API findings that contradict the official docs:
 * - The service path is `monitor/...` (not `keywords/monitor/...`, which
 *   302-redirects to the login page).
 * - Monitored keywords are identified by `domain` + `keyword` + `sengineid`
 *   and projects by `projhash` (see xovi_monitoring_get_domains /
 *   xovi_list_projects) — there are no numeric keyword/project IDs.
 */
export function registerMonitoringTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_monitoring_get_domains",
    "List all monitored domains with their project hashes (projectHash + domain pairs). The projectHash is the `projhash` other monitoring tools expect. ~10 credits.",
    {},
    async () => runCall(api, "monitor", "getDomains"),
  );

  server.tool(
    "xovi_monitoring_get_keywords",
    "List monitored keywords (daily tracking) with current positions; response items include keyword, domain and sengineId. Paginated. ~20 credits/100 rows.",
    {
      offset: offsetParam,
      rows: rowsParam,
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "getKeywords", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_get_keyword_rankings",
    "Get the current SERP rankings for one monitored keyword. ~25 credits.",
    {
      keyword: z.string().min(1).describe("The monitored keyword."),
      sengineid: sengineidParam,
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "getKeywordRankings", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_get_keyword_trend",
    "Get the daily position history of one monitored keyword (identified by domain + keyword + sengineid). ~15 credits.",
    {
      domain: domainParam,
      keyword: z.string().min(1).describe("The monitored keyword."),
      sengineid: sengineidParam,
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "getKeywordTrend", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_get_ovi_trend",
    "Get the OVI (visibility) history of a monitored project. ~5 credits/row.",
    {
      projhash: z
        .string()
        .min(1)
        .describe("Project hash (see xovi_monitoring_get_domains or xovi_list_projects)."),
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "getOviTrend", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_get_limits",
    "Get the monitoring keyword limits (used vs. available tracked keywords). Free — costs no credits. Always check this before adding keywords.",
    {},
    async () => runCall(api, "monitor", "getKeywordLimits"),
  );

  server.tool(
    "xovi_monitoring_add_keywords",
    "Add keywords to the daily monitoring of a project. Write operation — each keyword consumes monitoring quota and causes recurring daily credit load. Check xovi_monitoring_get_limits first. To track locally, pass the sengineid of a city-level search engine (must be created once in the XOVI suite UI; see xovi_get_search_engines). ~20 credits.",
    {
      projhash: z
        .string()
        .min(1)
        .describe("Project hash (see xovi_monitoring_get_domains or xovi_list_projects)."),
      keywords: z.string().min(1).describe("Comma-separated list of keywords to add."),
      sengineid: sengineidParam,
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "addKeywords", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_edit_keywords",
    "Edit monitored keywords selected by keyword and/or domain (the API requires at least one of the two). Endpoint-specific fields via extra_params. Write operation. ~10 credits.",
    {
      keyword: z.string().optional().describe("Selector: the monitored keyword."),
      domain: z.string().optional().describe("Selector: the monitored domain."),
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "editKeywords", { ...params, ...extra_params }),
  );

  server.tool(
    "xovi_monitoring_delete_keywords",
    "DESTRUCTIVE: Remove keywords from monitoring (selected by keyword and/or domain) — their daily tracking history stops. Cannot be undone — confirm with the user before calling, and check the response's success/count fields: the selector semantics are not fully documented, so verify what was actually deleted. ~10 credits.",
    {
      keyword: z.string().optional().describe("Selector: the monitored keyword."),
      domain: z.string().optional().describe("Selector: the monitored domain."),
      extra_params: extraParamsParam,
    },
    async ({ extra_params, ...params }) =>
      runCall(api, "monitor", "deleteKeywords", { ...params, ...extra_params }),
  );
}
