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
