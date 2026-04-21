/**
 * Refine large content using a small LLM (Anthropic claude-haiku).
 * Falls back to null if no API key is available or the call fails.
 *
 * The caller should fall back to paginated output when null is returned.
 */

const REFINE_MODEL = "claude-haiku-4-5";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_OUTPUT_TOKENS = 8192;

interface AnthropicResponse {
	content?: Array<{ type: string; text: string }>;
	error?: { message: string };
}

export async function refineContent(
	content: string,
	prompt: string,
	signal?: AbortSignal,
): Promise<string | null> {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) return null;

	try {
		const response = await fetch(ANTHROPIC_API, {
			method: "POST",
			signal,
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": ANTHROPIC_VERSION,
			},
			body: JSON.stringify({
				model: REFINE_MODEL,
				max_tokens: MAX_OUTPUT_TOKENS,
				messages: [
					{
						role: "user",
						content: `${prompt}\n\n<content>\n${content}\n</content>`,
					},
				],
			}),
		});

		if (!response.ok) return null;

		const data = (await response.json()) as AnthropicResponse;
		if (data.error) return null;

		return data.content?.find((b) => b.type === "text")?.text ?? null;
	} catch {
		// Fail gracefully — caller will fall back to pagination
		return null;
	}
}
