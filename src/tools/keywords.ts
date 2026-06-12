import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import {
  offsetParam,
  rowsParam,
  runCall,
  sengineParam,
  urlpatternParam,
  domainParam,
} from "./helpers.ts";

/**
 * Organic keyword data from XOVI's weekly crawl index
 * (service `keywords`, in contrast to the daily `monitor` tracking).
 *
 * Parameter names verified against the live API (the official docs are
 * unreliable here): the search engine ID is `sengine`, most endpoints take
 * `urlpattern`, but getRankingValue takes `domain`.
 */
export function registerKeywordTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_get_search_engines",
    "List all available search engines with their numeric IDs (e.g. 1 = Google Germany) including locale/city info. Use this instead of guessing IDs — locally scoped engines (city-level) also show up here once created in the XOVI suite UI. ~5 credits.",
    {},
    async () => runCall(api, "keywords", "getSearchEngines"),
  );

  server.tool(
    "xovi_get_keywords",
    "Get the organic keywords a domain ranks for (weekly XOVI crawl index): keyword, position, URL, search volume etc. Paginated. ~25 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "keywords", "getKeywords", params),
  );

  server.tool(
    "xovi_get_keyword_rankings",
    "Get the full SERP top-100 for a single keyword (which URLs rank at which position). ~20 credits.",
    {
      keyword: z.string().min(1).describe("The keyword to look up."),
      sengine: sengineParam,
    },
    async (params) => runCall(api, "keywords", "getKeywordRankings", params),
  );

  server.tool(
    "xovi_get_keyword_trend",
    "Get the weekly ranking history of one keyword for a domain (position over time). ~15 credits/row.",
    {
      keyword: z.string().min(1).describe("The keyword whose history to fetch."),
      urlpattern: urlpatternParam,
      sengine: sengineParam,
    },
    async (params) => runCall(api, "keywords", "getKeywordTrend", params),
  );

  server.tool(
    "xovi_get_ranking_trend",
    "Get the aggregated ranking trend of a domain over time (weekly index). ~5 credits/row.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
    },
    async (params) => runCall(api, "keywords", "getRankingTrend", params),
  );

  server.tool(
    "xovi_get_ranking_value",
    "Get the current ranking value of a domain (monetary equivalent of its organic rankings). ~15 credits.",
    {
      domain: domainParam,
      sengine: sengineParam,
    },
    async (params) => runCall(api, "keywords", "getRankingValue", params),
  );

  server.tool(
    "xovi_get_ovi_trend",
    "Get the OVI (Online Visibility Index) history of a domain — XOVI's visibility score over time. ~5 credits/row.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
    },
    async (params) => runCall(api, "keywords", "getStaticOviTrend", params),
  );

  server.tool(
    "xovi_get_top_domains",
    "Get the top domains ranked by OVI for a search engine (domain comparison). Paginated. ~20 credits/100 rows.",
    {
      sengine: sengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "keywords", "getRank", params),
  );

  server.tool(
    "xovi_get_ranking_column",
    "Get the ranking distribution of a domain (how many keywords rank in which position bucket). ~50 credits — relatively expensive, use deliberately.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
    },
    async (params) => runCall(api, "keywords", "getRankingColumn", params),
  );

  server.tool(
    "xovi_get_new_keywords",
    "Get keywords a domain newly gained in the last weekly index update. Paginated. ~50 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "keywords", "getNewKeywords", params),
  );

  server.tool(
    "xovi_get_lost_keywords",
    "Get keywords a domain lost in the last weekly index update. Paginated. ~50 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "keywords", "getLostKeywords", params),
  );

  server.tool(
    "xovi_get_pages",
    "Get the ranking pages of a domain (which URLs rank, with how many keywords). Paginated. ~20 credits/row — can get expensive on large result sets.",
    {
      urlpattern: urlpatternParam,
      sengine: sengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "keywords", "getPages", params),
  );
}
