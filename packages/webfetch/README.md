# @pi-lab/webfetch

A [pi coding agent](https://github.com/badlogic/pi-mono) extension that adds a `webfetch` tool — fetch any URL and get back clean Markdown, ready for the model to read.

## Features

- **HTML → Markdown** via [Mozilla Readability](https://github.com/mozilla/readability) (same engine as Firefox Reader Mode) + [Turndown](https://github.com/mixmark-io/turndown). Falls back to full-page conversion if Readability can't extract a main article.
- **Pagination** — large pages are sliced into chunks; the model reads page by page using `offset`.
- **Inline script index** — `<script>` tags are stripped from the Markdown body but listed as a numbered index at the end. The model can read any of them with `script=N`.
- **Redirect handling** — same-domain redirects are followed automatically (up to 10 hops); cross-domain redirects are surfaced to the model so it can decide whether to follow.
- **Binary downloads** — non-text responses (PDFs, images, etc.) are saved to `.pi/pi-lab/webfetch/tmp/` and the file path is returned.
- **LRU cache** — processed Markdown is cached in memory (default: 50 MB, 15 min TTL) so paginating the same URL doesn't re-fetch.
- **URL normalization** — protocol and hostname are lowercased, `http` is upgraded to `https`, default ports are stripped. Used as the cache key.

## Installation

```bash
# inside the pi-lab workspace
pnpm install

# build
cd packages/webfetch && pnpm build
```

Load with pi:

```bash
pi -e ./packages/webfetch/dist/index.mjs
```

Or add to your pi config for auto-loading:

```json
// ~/.pi/agent/config.json  (global)
// .pi/config.json           (project-local)
{
  "extensions": ["./packages/webfetch/dist/index.mjs"]
}
```

## Tool reference

### `webfetch`

Fetch a URL and return its content as Markdown.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | ✅ | URL to fetch |
| `offset` | number | — | Starting character position for pagination. Default: `0` |
| `max_length` | number | — | Max characters to return in this call. Default: `20000` |
| `script` | number | — | Index of an inline script to read (see [Inline scripts](#inline-scripts)) |

### Output formats

**Text page**

```
URL: https://example.com/docs
Offset: 0 / 85000 chars — truncated, call again with offset=20000

---

# Getting Started
…
```

When not truncated:

```
URL: https://example.com/docs
Length: 8432 chars

---

# Getting Started
…
```

**Cross-domain redirect**

```
REDIRECT 301: https://example.com → https://other.com/page
This URL redirects to a different domain. Call webfetch again with `redirect_url` to fetch the content.
```

**Binary file**

```
BINARY FILE: /path/to/.pi/pi-lab/webfetch/tmp/webfetch-1234567890.pdf
Content-Type: application/pdf
URL: https://example.com/report.pdf
```

### Pagination

When `truncated` is `true`, call `webfetch` again with `offset` incremented by the previous `returned_length`, repeating until `truncated` is `false`.

```
# First call
webfetch(url="https://example.com/long-page")
→ offset=0, returned_length=20000, truncated=true

# Second call
webfetch(url="https://example.com/long-page", offset=20000)
→ offset=20000, returned_length=20000, truncated=true

# Third call
webfetch(url="https://example.com/long-page", offset=40000)
→ offset=40000, returned_length=5000, truncated=false  ✓
```

The processed Markdown is cached after the first fetch, so subsequent paginated calls are served from memory.

### Inline scripts

Some pages embed data (JSON-LD, configuration, server-side state) inside `<script>` tags rather than visible HTML. These are stripped from the Markdown body to reduce noise, but listed in an index appended at the end of each response:

```
Inline scripts (3, call webfetch with script=N to read full content):
  [0]  1243 chars  {"@context":"https://schema.org","@type":"Article"…
  [1]   312 chars  window.__INITIAL_STATE__ = {"user":null,"theme":"d…
  [2]  8871 chars  !function(e,t){"use strict";var n=e.document;…
```

Read a specific script:

```
webfetch(url="https://example.com/page", script=0)
```

Pagination works the same way for scripts (`offset`, `max_length`).

## Configuration

The default export registers the tool with default settings. To customise, use `registerWebFetchTool` directly in your own extension:

```typescript
import { registerWebFetchTool, mergeConfig } from "@pi-lab/webfetch";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  registerWebFetchTool(pi, mergeConfig({
    maxPageLength: 10000,          // smaller pages
    cache: {
      maxSizeBytes: 20 * 1024 * 1024,  // 20 MB
      ttlMs: 5 * 60 * 1000,            // 5 minutes
    },
  }));
}
```

### Config options

| Option | Default | Description |
|--------|---------|-------------|
| `maxPageLength` | `20000` | Default max characters per paginated page |
| `cache.maxSizeBytes` | `52428800` (50 MB) | LRU cache size limit in bytes (measured as UTF-8 encoded Markdown) |
| `cache.ttlMs` | `900000` (15 min) | Cache entry TTL in milliseconds |

## HTML processing pipeline

```
HTTP response
     │
     ▼
Content-Type text/*?
     ├── No  → save to file, return path
     └── Yes
           ▼
        text/html?
           ├── No  → return as-is
           └── Yes
                 ▼
              Readability extraction
                 ├── Success (extracted ≥ 10% of source) → Turndown → Markdown
                 └── Fail → full HTML → Turndown → Markdown
                                  │
                              <script>, <style>,
                              <noscript>, <iframe>
                              stripped by Turndown
```

## Redirect policy

| Redirect type | Behaviour |
|---------------|-----------|
| Same domain (same protocol + port + hostname ignoring `www`) | Followed automatically, up to 10 hops |
| Cross-domain | Not followed; redirect info returned to model |
