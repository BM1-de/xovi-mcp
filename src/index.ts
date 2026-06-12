#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { XoviClient } from "./api-client.ts";
import { loadConfig } from "./config.ts";
import { registerUserTools } from "./tools/user.ts";
import { registerProjectTools } from "./tools/project.ts";
import { registerKeywordTools } from "./tools/keywords.ts";
import { registerMonitoringTools } from "./tools/monitoring.ts";
import { registerLinkTools } from "./tools/links.ts";
import { registerSeaTools } from "./tools/sea.ts";
import { registerReportTools } from "./tools/report.ts";
import { registerAddressbookTools } from "./tools/addressbook.ts";
import { registerGenericTools } from "./tools/generic.ts";

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const client = new XoviClient(config.xoviKey, config.baseUrl);

const server = new McpServer({
  name: "xovi-mcp",
  version: "0.1.0",
  description:
    "MCP Server for the XOVI SEO suite — projects, organic keyword data, daily ranking monitoring, backlinks, SEA, reports and address book.",
});

registerUserTools(server, client);
registerProjectTools(server, client);
registerKeywordTools(server, client);
registerMonitoringTools(server, client);
registerLinkTools(server, client);
registerSeaTools(server, client);
registerReportTools(server, client);
registerAddressbookTools(server, client);
registerGenericTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
