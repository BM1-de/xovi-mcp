import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { XoviApi } from "../api-client.ts";
import { runCall } from "./helpers.ts";

export function registerUserTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_get_credit_state",
    "Get the current XOVI API credit state (available/used credits). Free — costs no credits. Call this before credit-heavy operations to check headroom.",
    {},
    async () => runCall(api, "user", "getCreditstate"),
  );

  server.tool(
    "xovi_get_limits",
    "Get the XOVI account limits (plan limits such as projects, monitoring keywords, API quota). Free — costs no credits.",
    {},
    async () => runCall(api, "user", "getXoviLimits"),
  );

  server.tool(
    "xovi_get_subaccounts",
    "List all sub-accounts of the XOVI account with their permissions. ~10 credits.",
    {},
    async () => runCall(api, "user", "getSubaccounts"),
  );
}
