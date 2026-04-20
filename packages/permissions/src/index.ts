import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig, type PermissionConfig } from "./config";
import { sortRules, evaluate } from "./rules";
import { SessionCache, askUser } from "./ask";

export default function (pi: ExtensionAPI) {
	let sortedRules: ReturnType<typeof sortRules> = [];
	const cache = new SessionCache();

	pi.on("session_start", async (_event, ctx) => {
		const config: PermissionConfig = loadConfig(ctx.cwd);
		sortedRules = sortRules(config.rules);
		cache.clear();
	});

	pi.on("tool_call", async (event, ctx) => {
		const input = event.input as Record<string, unknown>;
		const result = evaluate(event.toolName, input, sortedRules);

		if (!result) return undefined;

		const { action, rule } = result;

		if (action === "allow") return undefined;

		if (action === "deny") {
			return { block: true, reason: rule.description ?? "Blocked by permissions" };
		}

		// action === "ask"
		const cached = cache.get(event.toolName, input);
		if (cached === "allow") return undefined;
		if (cached === "deny") {
			return { block: true, reason: rule.description ?? "Blocked by permissions" };
		}

		if (!ctx.hasUI) {
			return { block: true, reason: "ask rule requires UI" };
		}

		const decision = await askUser(event.toolName, input, cache, ctx);
		return decision === "allow"
			? undefined
			: { block: true, reason: rule.description ?? "Blocked by user" };
	});
}
