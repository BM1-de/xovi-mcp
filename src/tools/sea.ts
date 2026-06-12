import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { XoviApi } from "../api-client.ts";
import { domainParam, offsetParam, rowsParam, runCall, sengineParam } from "./helpers.ts";

export function registerSeaTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_sea_get_keywords",
    "Get the paid (Google Ads) keywords a domain advertises on, as observed by XOVI. Takes `domain` (live-verified), not urlpattern. Paginated. ~20 credits/100 rows.",
    {
      domain: domainParam,
      sengine: sengineParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "sea", "getKeywords", params),
  );
}
