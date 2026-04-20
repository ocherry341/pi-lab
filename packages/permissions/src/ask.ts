import { createHash } from "node:crypto";
import { ExtensionContext } from "@mariozechner/pi-coding-agent";

export class SessionCache {
	private cache: Map<string, "allow" | "deny"> = new Map();

	private callKey(toolName: string, input: Record<string, unknown>): string {
		const raw = JSON.stringify({ tool: toolName, input });
		return createHash("sha256").update(raw).digest("hex");
	}

	get(toolName: string, input: Record<string, unknown>): "allow" | "deny" | undefined {
		return this.cache.get(this.callKey(toolName, input));
	}

	set(toolName: string, input: Record<string, unknown>, decision: "allow" | "deny"): void {
		this.cache.set(this.callKey(toolName, input), decision);
	}

	clear(): void {
		this.cache.clear();
	}
}

export async function askUser(
	toolName: string,
	input: Record<string, unknown>,
	cache: SessionCache,
	ctx: ExtensionContext
): Promise<"allow" | "deny"> {
	const lines = Object.entries(input).map(([key, value]) => {
		const str = String(value);
		const truncated = str.length > 80 ? str.slice(0, 80) : str;
		return `  ${key}: ${truncated}`;
	});
	const title = `⚠️  ${toolName}\n${lines.join("\n")}`;

	const result = await ctx.ui.select(title, ["Allow", "Allow always", "Deny", "Deny always"]);

	if (result === "Allow always") {
		cache.set(toolName, input, "allow");
		return "allow";
	} else if (result === "Deny always") {
		cache.set(toolName, input, "deny");
		return "deny";
	} else if (result === "Allow") {
		return "allow";
	} else {
		// "Deny" or null (user closed)
		return "deny";
	}
}
