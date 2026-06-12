/**
 * Runtime configuration for the XOVI MCP server.
 *
 * The only required setting is the API key. The base URL is overridable for
 * testing; the production endpoint is fixed.
 */
export interface ServerConfig {
  /** XOVI API key (suite.xovi.net → Account → API Dashboard). */
  xoviKey: string;
  /** API base URL without trailing slash, default `https://suite.xovi.net/api`. */
  baseUrl: string;
}

export const DEFAULT_BASE_URL = "https://suite.xovi.net/api";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const xoviKey = env.XOVI_KEY?.trim();
  if (!xoviKey) {
    throw new Error(
      "XOVI_KEY environment variable is required. Get your API key at https://suite.xovi.net → Account → API Dashboard.",
    );
  }
  const baseUrl = (env.XOVI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { xoviKey, baseUrl };
}
