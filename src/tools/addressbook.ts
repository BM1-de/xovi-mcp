import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { XoviApi } from "../api-client.ts";
import { extraParamsParam, runCall } from "./helpers.ts";

export function registerAddressbookTools(server: McpServer, api: XoviApi) {
  server.tool(
    "xovi_addressbook_get_organisations",
    "List the organisations in the XOVI address book. ~10 credits.",
    {},
    async () => runCall(api, "addressbook", "getOrganisations"),
  );

  server.tool(
    "xovi_addressbook_get_persons",
    "List the persons in the XOVI address book. ~10 credits.",
    {},
    async () => runCall(api, "addressbook", "getPersons"),
  );

  server.tool(
    "xovi_addressbook_add_organisation",
    "Add an organisation to the XOVI address book. Write operation. ~10 credits.",
    {
      name: z.string().min(1).describe("Name of the organisation."),
      extra_params: extraParamsParam,
    },
    async ({ name, extra_params }) =>
      runCall(api, "addressbook", "addOrganisation", { name, ...extra_params }),
  );

  server.tool(
    "xovi_addressbook_add_person",
    "Add a person to the XOVI address book. Write operation. ~10 credits.",
    {
      firstname: z.string().min(1).describe("First name."),
      lastname: z.string().min(1).describe("Last name."),
      extra_params: extraParamsParam,
    },
    async ({ firstname, lastname, extra_params }) =>
      runCall(api, "addressbook", "addPerson", { firstname, lastname, ...extra_params }),
  );

  server.tool(
    "xovi_addressbook_edit_organisation",
    "Edit an organisation in the XOVI address book (fields via extra_params). Write operation. ~10 credits.",
    {
      id: z.union([z.string(), z.number()]).describe("Organisation ID."),
      extra_params: extraParamsParam,
    },
    async ({ id, extra_params }) =>
      runCall(api, "addressbook", "editOrganisation", { id, ...extra_params }),
  );

  server.tool(
    "xovi_addressbook_edit_person",
    "Edit a person in the XOVI address book (fields via extra_params). Write operation. ~10 credits.",
    {
      id: z.union([z.string(), z.number()]).describe("Person ID."),
      extra_params: extraParamsParam,
    },
    async ({ id, extra_params }) =>
      runCall(api, "addressbook", "editPerson", { id, ...extra_params }),
  );

  server.tool(
    "xovi_addressbook_delete_organisation",
    "DESTRUCTIVE: Permanently delete an organisation from the XOVI address book. Cannot be undone — confirm with the user before calling. ~10 credits.",
    {
      id: z.union([z.string(), z.number()]).describe("Organisation ID to delete."),
    },
    async ({ id }) => runCall(api, "addressbook", "deleteOrganisation", { id }),
  );

  server.tool(
    "xovi_addressbook_delete_person",
    "DESTRUCTIVE: Permanently delete a person from the XOVI address book. Cannot be undone — confirm with the user before calling. ~10 credits.",
    {
      id: z.union([z.string(), z.number()]).describe("Person ID to delete."),
    },
    async ({ id }) => runCall(api, "addressbook", "deletePerson", { id }),
  );
}
