import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import { runCall } from "./helpers.ts";

export function registerGenericTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_api_call",
    "Escape hatch: call any XOVI API endpoint not covered by a dedicated tool (GET <base>/<service>/<method> with arbitrary query parameters). Check the credit cost of the endpoint first — every XOVI call costs credits, some endpoints are expensive. The API key and format=json are added automatically and cannot be overridden.",
    {
      service: z.string().min(1).describe('XOVI service, e.g. "keywords", "links", "project".'),
      method: z
        .string()
        .min(1)
        .describe('Method name, may contain a sub-path, e.g. "getKeywords" or "monitor/getDomains".'),
      params: z
        .record(z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .describe("Query parameters for the endpoint (without key/format)."),
    },
    async ({ service, method, params }) => runCall(api, service, method, params ?? {}),
  );
}
