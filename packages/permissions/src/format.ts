const MAX_STRING_LENGTH = 80;

function truncate(str: string, max = MAX_STRING_LENGTH): string {
  const normalized = str.replace(/\n/g, "↵");
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}... [${str.length} characters]`;
}

function formatValue(key: string, value: unknown): string {
  if (typeof value === "string") {
    return `${key}: ${truncate(value)}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []`;
    if (typeof value[0] === "object" && value[0] !== null) {
      // array of objects: show count
      return `${key}: [${value.length} items]`;
    }
    // primitive array: join and truncate
    return `${key}: ${truncate(value.join(", "))}`;
  }

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value).join(", ");
    return `${key}: {${keys}}`;
  }

  return `${key}: ${String(value)}`;
}

// default formatter

function header(toolName: string): string {
  return `⚠️  ${toolName}\n${"-".repeat(toolName.length + 4)}`;
}

function defaultFormat(
  toolName: string,
  input: Record<string, unknown>,
): string {
  const lines = Object.entries(input).map(([k, v]) => `  ${formatValue(k, v)}`);
  return [header(toolName), ...lines].join("\n");
}

//

interface Edit {
  oldText?: string;
  newText?: string;
}

function formatEdit(_toolName: string, input: Record<string, unknown>): string {
  const path = typeof input.path === "string" ? input.path : "unknown";
  const edits = Array.isArray(input.edits) ? (input.edits as Edit[]) : [];

  const lines: string[] = [
    header("edit"),
    `  path: ${path}`,
    `  ${edits.length} change(s):`,
  ];

  for (let i = 0; i < edits.length; i++) {
    const { oldText = "", newText = "" } = edits[i];
    const from = truncate(oldText, 40);
    const to = truncate(newText, 40);
    lines.push(`    [${i + 1}] "${from}" → "${to}"`);
  }

  return lines.join("\n");
}

// registry

type ToolFormatter = (
  toolName: string,
  input: Record<string, unknown>,
) => string;

const toolFormatters: Record<string, ToolFormatter> = {
  edit: formatEdit,
};

export function buildTitle(
  toolName: string,
  input: Record<string, unknown>,
): string {
  const formatter = toolFormatters[toolName];
  return formatter
    ? formatter(toolName, input)
    : defaultFormat(toolName, input);
}
