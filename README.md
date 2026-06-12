# XOVI MCP Server

The [XOVI](https://www.xovi.de) SEO suite as MCP tools for Claude and other
AI agents. This (unofficial) server exposes the XOVI REST API: projects,
organic keyword data, daily ranking monitoring, OVI visibility trends,
backlinks, SEA keywords, PDF reports and the address book — plus a generic
escape hatch for undocumented endpoints.

Runs over stdio and works with any MCP client (Claude Code, Claude Desktop,
etc.). The package/repo name is `xovi-mcp`.

## Important: credits

**Every XOVI API call costs credits** (except the few marked *free*). Each
tool description states the approximate cost, and whenever the API reports
the consumed credits they are echoed back in the tool output as
`creditsUsed`. Check your headroom with `xovi_get_credit_state` (free)
before running larger operations.

## Tools

- [User](#user) — credit state, account limits, sub-accounts
- [Projects & labels](#projects--labels) — manage XOVI projects and labels
- [Organic keywords](#organic-keywords) — weekly crawl index: rankings, trends, OVI, new/lost keywords
- [Monitoring](#monitoring) — daily keyword tracking per project
- [Backlinks](#backlinks) — link profile, anchors, linked pages
- [SEA](#sea) — paid keyword intelligence
- [Reports](#reports) — list and download PDF reports
- [Address book](#address-book) — organisations and persons
- [Generic](#generic) — raw access to any endpoint

### User

| Tool | Endpoint | Credits |
|---|---|---|
| `xovi_get_credit_state` | `user/getCreditstate` | free |
| `xovi_get_limits` | `user/getXoviLimits` | free |
| `xovi_get_subaccounts` | `user/getSubaccounts` | ~10 |

### Projects & labels

| Tool | Endpoint | Credits | Notes |
|---|---|---|---|
| `xovi_list_projects` | `project/getProjects` | ~5 | |
| `xovi_list_labels` | `project/getLabels` | ~15 | |
| `xovi_list_categories` | `project/getCategories` | ~10 | |
| `xovi_add_project` | `project/addProject` | ~15 | write |
| `xovi_add_label` | `project/addLabel` | ~5 | write |
| `xovi_edit_label` | `project/editLabel` | ~5 | write |
| `xovi_delete_label` | `project/deleteLabel` | ~5 | **destructive** |

### Organic keywords

Weekly XOVI crawl index (in contrast to the daily [Monitoring](#monitoring)).
All tools take a `sengine` ID (default `1` = Google Germany; full list via
`xovi_get_search_engines` — parameter name live-verified, the official docs'
`searchengine` does not work). Paginated tools take `offset` (default 0)
and `rows` (default 100, max 100) and report `totalRows`.

| Tool | Endpoint | Credits | Notes |
|---|---|---|---|
| `xovi_get_search_engines` | `keywords/getSearchEngines` | ~5 | numeric IDs for all tools |
| `xovi_get_keywords` | `keywords/getKeywords` | ~25/100 rows | what a domain ranks for |
| `xovi_get_keyword_rankings` | `keywords/getKeywordRankings` | ~20 | SERP top-100 for one keyword |
| `xovi_get_keyword_trend` | `keywords/getKeywordTrend` | ~15/row | weekly position history |
| `xovi_get_ranking_trend` | `keywords/getRankingTrend` | ~5/row | domain ranking trend |
| `xovi_get_ranking_value` | `keywords/getRankingValue` | ~15 | monetary ranking value |
| `xovi_get_ovi_trend` | `keywords/getStaticOviTrend` | ~5/row | OVI visibility history |
| `xovi_get_top_domains` | `keywords/getRank` | ~20/100 rows | top domains by OVI |
| `xovi_get_ranking_column` | `keywords/getRankingColumn` | ~50 | position distribution |
| `xovi_get_new_keywords` | `keywords/getNewKeywords` | ~50/100 rows | gained last index update |
| `xovi_get_lost_keywords` | `keywords/getLostKeywords` | ~50/100 rows | lost last index update |
| `xovi_get_pages` | `keywords/getPages` | ~20/row | ranking URLs of a domain |

### Monitoring

Daily keyword tracking per project (XOVI service `monitor`). Two live-verified
deviations from the official docs: the service path is `monitor/...` (not
`keywords/monitor/...`, which redirects to the login page), and entities are
identified by `projhash` / `domain` + `keyword` + `sengineid` — there are no
numeric project/keyword IDs. Local (city-level) tracking works by passing the
`sengineid` of a city search engine; such engines must be created once in the
XOVI suite UI (there is no API endpoint for that).

| Tool | Endpoint | Credits | Notes |
|---|---|---|---|
| `xovi_monitoring_get_domains` | `monitor/getDomains` | ~10 | projectHash + domain pairs |
| `xovi_monitoring_get_keywords` | `monitor/getKeywords` | ~20/100 rows | paginated, no required params |
| `xovi_monitoring_get_keyword_rankings` | `monitor/getKeywordRankings` | ~25 | by `keyword` + `sengineid` |
| `xovi_monitoring_get_keyword_trend` | `monitor/getKeywordTrend` | ~15 | by `domain` + `keyword` + `sengineid` |
| `xovi_monitoring_get_ovi_trend` | `monitor/getOviTrend` | ~5/row | by `projhash` |
| `xovi_monitoring_get_limits` | `monitor/getKeywordLimits` | free | check before adding |
| `xovi_monitoring_add_keywords` | `monitor/addKeywords` | ~20 | write; by `projhash`, consumes tracking quota |
| `xovi_monitoring_edit_keywords` | `monitor/editKeywords` | ~10 | write; selects by `keyword`/`domain` |
| `xovi_monitoring_delete_keywords` | `monitor/deleteKeywords` | ~10 | **destructive**; selects by `keyword`/`domain` |

### Backlinks

| Tool | Endpoint | Credits |
|---|---|---|
| `xovi_get_backlink_trend` | `links/getDomainTrend` | ~15/row |
| `xovi_get_backlinks` | `links/getBacklinks` | ~10/100 rows |
| `xovi_get_linktexts` | `links/getLinktexts` | ~20/100 rows |
| `xovi_get_hrefs` | `links/getHrefs` | ~20/100 rows |
| `xovi_get_linked_pages` | `links/getLinkedPages` | ~20/100 rows |

### SEA

| Tool | Endpoint | Credits |
|---|---|---|
| `xovi_sea_get_keywords` | `sea/getKeywords` | ~20/100 rows |

### Reports

| Tool | Endpoint | Credits |
|---|---|---|
| `xovi_list_reports` | `report/getDownloads` | ~5 |
| `xovi_get_report_pdf` | `report/getPdf` | ~5 |

### Address book

| Tool | Endpoint | Credits | Notes |
|---|---|---|---|
| `xovi_addressbook_get_organisations` | `addressbook/getOrganisations` | ~10 | |
| `xovi_addressbook_get_persons` | `addressbook/getPersons` | ~10 | |
| `xovi_addressbook_add_organisation` | `addressbook/addOrganisation` | ~10 | write |
| `xovi_addressbook_add_person` | `addressbook/addPerson` | ~10 | write |
| `xovi_addressbook_edit_organisation` | `addressbook/editOrganisation` | ~10 | write |
| `xovi_addressbook_edit_person` | `addressbook/editPerson` | ~10 | write |
| `xovi_addressbook_delete_organisation` | `addressbook/deleteOrganisation` | ~10 | **destructive** |
| `xovi_addressbook_delete_person` | `addressbook/deletePerson` | ~10 | **destructive** |

### Generic

| Tool | Notes |
|---|---|
| `xovi_api_call` | Escape hatch: `service` + `method` (may contain a sub-path) + arbitrary `params`. For endpoints without a dedicated tool. Check the credit cost first. |

XOVI parameter names are endpoint-specific and not fully documented. On
error code `80` ("param missing") the response includes a `paramname` field
naming the expected parameter — the write/edit tools accept an
`extra_params` object so you can supply such parameters without code
changes.

## Tool output format

Success:

```json
{
  "ok": true,
  "creditsUsed": 25,
  "totalRows": 1234,
  "data": [ ... ]
}
```

`creditsUsed` and `totalRows` appear only when the API reports them. On API
errors the tool returns an MCP error result:

```json
{
  "ok": false,
  "errorCode": 80,
  "error": "param missing",
  "paramname": "urlpattern"
}
```

## Setup

```bash
git clone <repo-url> xovi-mcp
cd xovi-mcp
npm install
npm run build
npm test
```

Node 18 or higher (Node 22+ recommended; the test suite uses Node's
built-in TypeScript type stripping).

## Configuration

| Env-var | Required | Description |
|---|---|---|
| `XOVI_KEY` | yes | XOVI API key (suite.xovi.net → Account → API Dashboard). |
| `XOVI_BASE_URL` | no | API base URL, default `https://suite.xovi.net/api`. |

The server refuses to start without `XOVI_KEY`. The key is sent as a query
parameter (XOVI does not support auth headers) and is masked as `***` in
every error message the server produces.

## Registration with Claude

```bash
claude mcp add --scope user xovi \
  -e XOVI_KEY="your-api-key" \
  -- node /absolute/path/to/xovi-mcp/dist/index.js
```

Or add it manually to `mcpServers` in your Claude Desktop config
(`~/Library/Application Support/Claude/claude_desktop_config.json` on
macOS) and / or Claude Code config (`~/.claude.json`):

```jsonc
"xovi": {
  "command": "node",
  "args": ["/absolute/path/to/xovi-mcp/dist/index.js"],
  "env": {
    "XOVI_KEY": "your-api-key"
  }
}
```

Restart Claude Desktop completely (Cmd+Q + re-open) so the daemon reloads
the MCP server list. In Claude Code a new chat is enough.

## Tests

```bash
npm test
```

Unit tests use Node's built-in test runner. The HTTP layer is tested with a
mocked `fetch`, the tools end-to-end through an in-memory MCP transport
with a mocked API client — no network access and no credits needed.

## About BM1

`xovi-mcp` is built and maintained by [BM1](https://www.bm1.de), a German
agency for SEO, web development and custom software. We build
search-visible websites, data-driven SEO setups and special-purpose tooling
like this MCP server. If you need help with SEO, a web project or an
integration nobody offers off the shelf — [talk to us](https://www.bm1.de).

## License

MIT
