import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import { extraParamsParam, runCall } from "./helpers.ts";

export function registerProjectTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_list_projects",
    "List all projects configured in the XOVI account. ~5 credits.",
    {},
    async () => runCall(api, "project", "getProjects"),
  );

  server.tool(
    "xovi_list_labels",
    "List all project labels in the XOVI account. ~15 credits.",
    {},
    async () => runCall(api, "project", "getLabels"),
  );

  server.tool(
    "xovi_list_categories",
    "List all label categories in the XOVI account. ~10 credits.",
    {},
    async () => runCall(api, "project", "getCategories"),
  );

  server.tool(
    "xovi_add_project",
    "Create a new project in the XOVI account. Write operation — creates persistent data. ~15 credits.",
    {
      name: z.string().min(1).describe("Name of the new project."),
      extra_params: extraParamsParam,
    },
    async ({ name, extra_params }) =>
      runCall(api, "project", "addProject", { name, ...extra_params }),
  );

  server.tool(
    "xovi_add_label",
    "Create a new label in a category. Write operation. ~5 credits.",
    {
      category: z.string().min(1).describe("Category the label belongs to."),
      name: z.string().min(1).describe("Name of the new label."),
      extra_params: extraParamsParam,
    },
    async ({ category, name, extra_params }) =>
      runCall(api, "project", "addLabel", { category, name, ...extra_params }),
  );

  server.tool(
    "xovi_edit_label",
    "Rename an existing label. Write operation. ~5 credits.",
    {
      id: z.union([z.string(), z.number()]).describe("ID of the label to edit."),
      name: z.string().min(1).describe("New label name."),
      extra_params: extraParamsParam,
    },
    async ({ id, name, extra_params }) =>
      runCall(api, "project", "editLabel", { id, name, ...extra_params }),
  );

  server.tool(
    "xovi_delete_label",
    "DESTRUCTIVE: Permanently delete a label from the XOVI account. Cannot be undone — confirm with the user before calling. ~5 credits.",
    {
      id: z.union([z.string(), z.number()]).describe("ID of the label to delete."),
    },
    async ({ id }) => runCall(api, "project", "deleteLabel", { id }),
  );
}
