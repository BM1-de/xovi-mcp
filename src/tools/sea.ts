import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { XoviApi } from "../api-client.ts";
import { offsetParam, rowsParam, runCall, searchengineParam, urlpatternParam } from "./helpers.ts";

export function registerSeaTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_sea_get_keywords",
    "Get the paid (Google Ads) keywords a domain advertises on, as observed by XOVI. Paginated. ~20 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      searchengine: searchengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "sea", "getKeywords", params),
  );
}
