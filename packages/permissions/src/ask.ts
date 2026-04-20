import { Rule } from "./config";
import { ExtensionContext } from "@mariozechner/pi-coding-agent";

export class SessionCache {
	private cache: Map<string, "allow" | "deny"> = new Map();

	key(rule: Rule): string {
		return JSON.stringify(rule.match);
	}

	get(rule: Rule): "allow" | "deny" | undefined {
		return this.cache.get(this.key(rule));
	}

	set(rule: Rule, decision: "allow" | "deny"): void {
		this.cache.set(this.key(rule), decision);
	}

	clear(): void {
		this.cache.clear();
	}
}

export async function askUser(
	toolName: string,
	input: Record<string, unknown>,
	rule: Rule,
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
		cache.set(rule, "allow");
		return "allow";
	} else if (result === "Deny always") {
		cache.set(rule, "deny");
		return "deny";
	} else if (result === "Allow") {
		return "allow";
	} else {
		// "Deny" or null (user closed)
		return "deny";
	}
}
