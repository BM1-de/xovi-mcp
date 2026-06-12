import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import { runCall } from "./helpers.ts";

export function registerReportTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_list_reports",
    "List the downloadable reports available in the XOVI account. ~5 credits.",
    {},
    async () => runCall(api, "report", "getDownloads"),
  );

  server.tool(
    "xovi_get_report_pdf",
    "Get the PDF download for a report by its ID (see xovi_list_reports). ~5 credits.",
    {
      reportId: z.union([z.string(), z.number()]).describe("Report ID from xovi_list_reports."),
    },
    async (params) => runCall(api, "report", "getPdf", params),
  );
}
