import * as os from "node:os";
import * as path from "node:path";
import { minimatch } from "minimatch";
import { Action, Rule } from "./config";

export const ACTION_ORDER: Record<Action, number> = {
  deny: 2,
  ask: 1,
  allow: 0,
};

export function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return ACTION_ORDER[b.action] - ACTION_ORDER[a.action];
  });
}

export function matchesRule(
  rule: Rule,
  toolName: string,
  input: Record<string, unknown>
): boolean {
  if (rule.match.tool !== "*" && rule.match.tool !== toolName) {
    return false;
  }

  const params = rule.match.params;
  if (params) {
    for (const [key, pattern] of Object.entries(params)) {
      if (!(key in input)) return false;
      const value = String(input[key]);
      try {
        if (!new RegExp(pattern, "i").test(value)) return false;
      } catch {
        if (!value.includes(pattern)) return false;
      }
    }
  }

  const paths = rule.match.paths;
  if (paths && paths.length > 0) {
    const pathKey = rule.match.pathParam ?? "path";
    if (!(pathKey in input)) return false;
    const rawValue = String(input[pathKey]);
    const resolved = path.resolve(rawValue);
    const matched = paths.some((pattern) => {
      const expanded = pattern.startsWith("~/") || pattern === "~"
        ? path.join(os.homedir(), pattern.slice(1))
        : pattern;
      const resolvedPattern = path.resolve(expanded);
      if (expanded.includes("*")) {
        return minimatch(resolved, resolvedPattern, { dot: true });
      }
      // directory prefix: /a/b matches /a/b, /a/b/c but not /a/bc
      const dir = resolvedPattern.endsWith(path.sep)
        ? resolvedPattern
        : resolvedPattern + path.sep;
      return resolved === resolvedPattern || resolved.startsWith(dir);
    });
    if (!matched) return false;
  }

  return true;
}

export function evaluate(
  toolName: string,
  input: Record<string, unknown>,
  sortedRules: Rule[]
): { action: Action; rule: Rule } | null {
  for (const rule of sortedRules) {
    if (matchesRule(rule, toolName, input)) {
      return { action: rule.action, rule };
    }
  }
  return null;
}
