import { Type } from "@sinclair/typebox";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { WebFetchConfig } from "./config.js";
import { Blocklist } from "./blocklist.js";
import { WebFetchCache } from "./cache.js";
import { normalizeUrl } from "./normalize.js";
import { fetchUrl } from "./fetch.js";
import { processHtml, processPlainText } from "./content.js";
import { refineContent } from "./refine.js";

// ─── Output shapes ────────────────────────────────────────────────────────────

interface TextOutput {
	content: string;
	truncated: boolean;
	total_length: number;
	offset: number;
	returned_length: number;
	url: string;
	content_type: string;
	refined?: boolean;
}

interface BinaryOutput {
	file_path: string;
	content_type: string;
	url: string;
}

interface RedirectOutput {
	redirect: true;
	original_url: string;
	redirect_url: string;
	status_code: number;
	message: string;
}

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerWebFetchTool(pi: ExtensionAPI, config: WebFetchConfig): void {
	const blocklist = new Blocklist(config.blocklist);
	const cache = new WebFetchCache(config.cache);

	// Initialize blocklist in background (fail-open on errors)
	void blocklist.init();

	pi.on("session_shutdown", async () => {
		blocklist.destroy();
		cache.clear();
	});

	pi.registerTool({
		name: "webfetch",
		label: "Web Fetch",
		description: [
			"Fetch content from a URL and return it as Markdown text.",
			"Handles HTML extraction via Mozilla Readability, pagination for large pages,",
			"and AI-assisted refinement when a prompt is provided for very large content.",
			"Non-text content (images, PDFs, etc.) is saved to a local file and the path is returned.",
			"Cross-domain redirects are reported back so you can decide whether to follow them.",
		].join(" "),
		promptSnippet: "Fetch and read web page content from a URL",
		promptGuidelines: [
			"Use webfetch to retrieve content from URLs instead of suggesting the user open a browser.",
			"Pass a focused `prompt` parameter when fetching documentation or articles to extract only relevant sections.",
			"For paginated results, increment `offset` by `returned_length` and call webfetch again until `truncated` is false.",
			"If webfetch returns a redirect result, call it again with the `redirect_url`.",
		],
		parameters: Type.Object({
			url: Type.String({
				description: "The URL to fetch.",
			}),
			prompt: Type.Optional(
				Type.String({
					description:
						"When content exceeds the refinement threshold (default 50 000 chars), " +
						"this text guides the small model to extract only the relevant information.",
				}),
			),
			offset: Type.Optional(
				Type.Number({
					description: "Starting character position for pagination. Defaults to 0.",
				}),
			),
			max_length: Type.Optional(
				Type.Number({
					description: `Maximum characters to return in this call. Defaults to ${config.maxPageLength}.`,
				}),
			),
		}),

		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			const { url, prompt, offset = 0, max_length } = params;
			const maxLength = max_length ?? config.maxPageLength;

			// ── Normalize URL ───────────────────────────────────────────────
			let normalizedUrl: string;
			try {
				normalizedUrl = normalizeUrl(url);
			} catch {
				throw new Error(`Invalid URL: ${url}`);
			}

			// Temp directory for binary downloads
			const tempDir = join(ctx.cwd, ".pi", "pi-lab", "webfetch", "tmp");

			onUpdate?.({
				content: [{ type: "text", text: `Fetching ${normalizedUrl}…` }],
				details: {},
			});

			// ── Check cache (keyed on normalized URL) ───────────────────────
			let markdown = cache.get(normalizedUrl);

			if (!markdown) {
				// ── Fetch ────────────────────────────────────────────────────
				const result = await fetchUrl(normalizedUrl, blocklist, tempDir, signal);

				// ── Redirect ─────────────────────────────────────────────────
				if (result.type === "redirect") {
					const output: RedirectOutput = {
						redirect: true,
						original_url: result.originalUrl,
						redirect_url: result.redirectUrl,
						status_code: result.statusCode,
						message:
							"This URL redirects to a different domain. " +
							"Call webfetch again with `redirect_url` to fetch the content.",
					};
					return {
						content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
						details: output,
					};
				}

				// ── Binary ───────────────────────────────────────────────────
				if (result.type === "binary") {
					const output: BinaryOutput = {
						file_path: result.filePath,
						content_type: result.contentType,
						url: result.url,
					};
					return {
						content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
						details: output,
					};
				}

				// ── Process text content ─────────────────────────────────────
				onUpdate?.({
					content: [{ type: "text", text: "Processing content…" }],
					details: {},
				});

				if (result.contentType === "text/html") {
					const processed = await processHtml(result.content, normalizedUrl);
					markdown = processed.markdown;
				} else {
					markdown = processPlainText(result.content);
				}

				// Store in cache (full processed Markdown, before pagination)
				cache.set(normalizedUrl, markdown);
			}

			// ── Refinement (content > threshold AND prompt provided) ─────────
			if (markdown.length > config.refinementThreshold && prompt) {
				onUpdate?.({
					content: [
						{
							type: "text",
							text: `Content is large (${markdown.length.toLocaleString()} chars), refining with AI…`,
						},
					],
					details: {},
				});

				const refined = await refineContent(markdown, prompt, signal);

				if (refined) {
					const output: TextOutput = {
						content: refined,
						truncated: false,
						total_length: refined.length,
						offset: 0,
						returned_length: refined.length,
						url: normalizedUrl,
						content_type: "text/markdown",
						refined: true,
					};
					return {
						content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
						details: output,
					};
				}
				// Fall through to pagination if refinement fails/unavailable
			}

			// ── Pagination ───────────────────────────────────────────────────
			const totalLength = markdown.length;
			const slice = markdown.slice(offset, offset + maxLength);
			const truncated = offset + maxLength < totalLength;

			const output: TextOutput = {
				content: slice,
				truncated,
				total_length: totalLength,
				offset,
				returned_length: slice.length,
				url: normalizedUrl,
				content_type: "text/markdown",
			};

			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				details: output,
			};
		},
	});
}
