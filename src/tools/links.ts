import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { XoviApi } from "../api-client.ts";
import { offsetParam, rowsParam, runCall, urlpatternParam } from "./helpers.ts";

export function registerLinkTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_get_backlink_trend",
    "Get the backlink growth/loss history of a domain over time. ~15 credits/row.",
    {
      urlpattern: urlpatternParam,
    },
    async (params) => runCall(api, "links", "getDomainTrend", params),
  );

  server.tool(
    "xovi_get_backlinks",
    "Get the backlinks pointing to a domain (source URL, target, anchor, attributes). Paginated — check totalRows. ~10 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "links", "getBacklinks", params),
  );

  server.tool(
    "xovi_get_linktexts",
    "Get the anchor text distribution of a domain's backlink profile. Paginated. ~20 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "links", "getLinktexts", params),
  );

  server.tool(
    "xovi_get_hrefs",
    "Get the link target URLs (hrefs) used by backlinks pointing to a domain. Paginated. ~20 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "links", "getHrefs", params),
  );

  server.tool(
    "xovi_get_linked_pages",
    "Get which pages of a domain receive backlinks (link target distribution). Paginated. ~20 credits/100 rows.",
    {
      urlpattern: urlpatternParam,
      offset: offsetParam,
      rows: rowsParam,
    },
    async (params) => runCall(api, "links", "getLinkedPages", params),
  );
}
