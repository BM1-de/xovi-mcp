/**
 * HTTP client for the XOVI API.
 *
 * XOVI specifics this client encapsulates:
 * - Every parameter (including the API key and `format=json`) goes into the
 *   query string. Path-style parameters make the API treat the request as a
 *   browser request and answer with a 302 redirect to the login page.
 * - The API answers with one of two response envelopes; `normalizeResponse`
 *   maps both onto a single `XoviResponse` shape.
 * - The API key must never leak into error messages or tool output, so every
 *   error string passes through `maskKey` before it leaves this module.
 */

export type ParamValue = string | number | boolean | undefined;

/** Normalised XOVI response, independent of which envelope the API used. */
export interface XoviResponse {
  ok: boolean;
  /** Payload: `apiResult` (envelope A) or `items`/remaining fields (envelope B). */
  data: unknown;
  /** Credits charged for this call, when the API reports them. */
  credits?: number;
  /** Total rows available (pagination), when the API reports them. */
  totalRows?: number;
  errorCode?: number;
  errorMessage?: string;
  /** On error 80 ("param missing") XOVI names the expected parameter here. */
  paramname?: string;
}

export interface XoviApi {
  call(service: string, method: string, params?: Record<string, ParamValue>): Promise<XoviResponse>;
}

export class XoviError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XoviError";
  }
}

/**
 * Replaces the API key with `***` wherever it could show up in a string
 * (error messages, URLs, response snippets). Also masks any `key=` query
 * parameter generically, in case a URL contains a key that differs from the
 * configured one.
 */
export function maskKey(text: string, key?: string): string {
  let out = text;
  if (key && key.length > 0) {
    out = out.split(key).join("***");
  }
  out = out.replace(/([?&]key=)[^&\s"']+/gi, "$1***");
  return out;
}

function asNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function extractParamname(...sources: unknown[]): string | undefined {
  for (const source of sources) {
    if (source !== null && typeof source === "object") {
      const found = asString((source as Record<string, unknown>).paramname);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Maps both documented XOVI envelopes onto `XoviResponse`:
 *
 * A) `{ apiErrorCode, apiErrorMessage, apiResult }`
 * B) `{ request, response: { status, code, credits, items, totalRows, ... } }`
 *
 * Unknown shapes pass through as `{ ok: true, data: <body> }` so the generic
 * `xovi_api_call` tool stays usable for undocumented endpoints.
 */
export function normalizeResponse(body: unknown): XoviResponse {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;

    if ("apiErrorCode" in obj) {
      const code = asNumber(obj.apiErrorCode) ?? -1;
      const ok = code === 0;
      const result: XoviResponse = { ok, data: obj.apiResult ?? null };
      const credits = asNumber(obj.credits);
      if (credits !== undefined) result.credits = credits;
      if (!ok) {
        result.errorCode = code;
        result.errorMessage = asString(obj.apiErrorMessage);
        const paramname = extractParamname(obj, obj.apiResult);
        if (paramname) result.paramname = paramname;
      }
      return result;
    }

    if ("response" in obj && obj.response !== null && typeof obj.response === "object") {
      const resp = obj.response as Record<string, unknown>;
      const { status, code, credits, items, totalRows, message, ...rest } = resp;
      const ok = status !== "error";
      const result: XoviResponse = {
        ok,
        data: items !== undefined ? items : Object.keys(rest).length > 0 ? rest : null,
      };
      const creditsNum = asNumber(credits);
      if (creditsNum !== undefined) result.credits = creditsNum;
      const totalRowsNum = asNumber(totalRows);
      if (totalRowsNum !== undefined) result.totalRows = totalRowsNum;
      if (!ok) {
        result.errorCode = asNumber(code);
        result.errorMessage = asString(message) ?? asString(rest.error);
        const paramname = extractParamname(resp);
        if (paramname) result.paramname = paramname;
      }
      return result;
    }
  }

  return { ok: true, data: body };
}

export class XoviClient implements XoviApi {
  private key: string;
  private baseUrl: string;

  constructor(key: string, baseUrl: string) {
    this.key = key;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private mask(text: string): string {
    return maskKey(text, this.key);
  }

  /**
   * Calls `<baseUrl>/<service>/<method>` with all params as query string.
   * `key` and `format=json` are set last so caller params can never override
   * them. Throws `XoviError` (key-masked) on transport-level problems;
   * API-level errors are reported via the normalised response instead.
   */
  async call(
    service: string,
    method: string,
    params: Record<string, ParamValue> = {},
  ): Promise<XoviResponse> {
    const url = new URL(`${this.baseUrl}/${service}/${method}`);
    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(name, String(value));
      }
    }
    url.searchParams.set("key", this.key);
    url.searchParams.set("format", "json");

    let response: Response;
    try {
      // Redirects are not followed: a 302 means the API treated the request
      // as a browser request (typically: invalid key) and must surface as a
      // clear error instead of an HTML login page.
      response = await fetch(url.toString(), { redirect: "manual" });
    } catch (err) {
      const cause =
        err instanceof Error && err.cause instanceof Error ? ` (${err.cause.message})` : "";
      const msg = err instanceof Error ? err.message : String(err);
      throw new XoviError(
        this.mask(`Network error calling ${service}/${method}: ${msg}${cause}`),
      );
    }

    if (response.status >= 300 && response.status < 400) {
      throw new XoviError(
        `XOVI API redirected (HTTP ${response.status}) on ${service}/${method}. ` +
          "The API treated the request as a browser request — this usually means the API key is invalid.",
      );
    }

    const text = await response.text();

    if (!response.ok) {
      throw new XoviError(
        this.mask(`XOVI API HTTP ${response.status} on ${service}/${method}: ${text.slice(0, 300)}`),
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      const contentType = response.headers.get("content-type") ?? "unknown";
      throw new XoviError(
        this.mask(
          `XOVI API returned non-JSON (content-type: ${contentType}) on ${service}/${method}: ${text.slice(0, 200)}`,
        ),
      );
    }

    return normalizeResponse(body);
  }
}
