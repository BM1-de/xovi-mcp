import { z } from "zod";
import { maskKey } from "../api-client.ts";
import type { XoviApi, ParamValue } from "../api-client.ts";

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  [key: string]: unknown;
}

export function toolResult(payload: unknown, isError = false): ToolResult {
  const result: ToolResult = {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
  if (isError) result.isError = true;
  return result;
}

/**
 * Executes one XOVI call and maps the normalised response onto the uniform
 * tool payload. API-level errors (`ok: false`) become MCP tool errors with
 * code, message and — when XOVI names it — the missing parameter
 * (`paramname`, error code 80). Thrown errors are masked defensively even
 * though `XoviClient` already masks its own messages.
 */
export async function runCall(
  api: XoviApi,
  service: string,
  method: string,
  params: Record<string, ParamValue> = {},
): Promise<ToolResult> {
  try {
    const res = await api.call(service, method, params);
    if (!res.ok) {
      const payload: Record<string, unknown> = {
        ok: false,
        errorCode: res.errorCode ?? null,
        error: res.errorMessage ?? "XOVI API error",
      };
      if (res.paramname) payload.paramname = res.paramname;
      if (res.credits !== undefined) payload.creditsUsed = res.credits;
      return toolResult(payload, true);
    }
    const payload: Record<string, unknown> = { ok: true };
    if (res.credits !== undefined) payload.creditsUsed = res.credits;
    if (res.totalRows !== undefined) payload.totalRows = res.totalRows;
    payload.data = res.data;
    return toolResult(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolResult({ ok: false, error: maskKey(msg) }, true);
  }
}

/** Shared zod fragments so all tools describe common parameters identically. */
export const searchengineParam = z
  .number()
  .int()
  .positive()
  .default(1)
  .describe(
    "Numeric XOVI search engine ID, default 1 (Google Germany). Full list via xovi_get_search_engines.",
  );

export const offsetParam = z
  .number()
  .int()
  .min(0)
  .default(0)
  .describe("Pagination offset (0-based). Combine with rows; totalRows in the response tells the overall count.");

export const rowsParam = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(100)
  .describe("Rows per call, max 100.");

export const urlpatternParam = z
  .string()
  .min(1)
  .describe('Domain or URL pattern without protocol, e.g. "www.example.com".');

export const extraParamsParam = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .optional()
  .describe(
    "Additional endpoint-specific query parameters. XOVI parameter names are not fully documented; on error 80 (param missing) the response field 'paramname' tells you which parameter the endpoint expects.",
  );
