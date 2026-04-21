import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";

let turndownInstance: TurndownService | null = null;

function getTurndown(): TurndownService {
	if (!turndownInstance) {
		turndownInstance = new TurndownService({
			headingStyle: "atx",
			codeBlockStyle: "fenced",
			bulletListMarker: "-",
		});

		// Keep code blocks intact
		turndownInstance.keep(["pre", "code"]);
	}
	return turndownInstance;
}

export interface ContentProcessResult {
	markdown: string;
	method: "readability" | "full-html" | "plain";
}

/**
 * Process HTML content:
 * 1. Try Mozilla Readability to extract main content
 * 2. If extraction ratio < 10%, fall back to full HTML → Markdown
 */
export async function processHtml(html: string, _url: string): Promise<ContentProcessResult> {
	const td = getTurndown();

	// Parse HTML with linkedom (lightweight DOM implementation)
	const { document } = parseHTML(html);

	// Attempt Readability extraction
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const reader = new Readability(document as any);
		const article = reader.parse();

		if (article?.content) {
			const ratio = article.content.length / html.length;

			// Accept if extraction is meaningful (>= 10% of source)
			if (ratio >= 0.1) {
				return {
					markdown: td.turndown(article.content),
					method: "readability",
				};
			}
		}
	} catch {
		// Fall through to full HTML conversion
	}

	// Fallback: convert full HTML to Markdown
	return {
		markdown: td.turndown(html),
		method: "full-html",
	};
}

/**
 * Process plain text / markdown content.
 * Currently a pass-through — future versions may normalize line endings, etc.
 */
export function processPlainText(text: string): string {
	return text;
}
