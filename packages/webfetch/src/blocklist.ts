import type { BlocklistConfig } from "./config.js";

/**
 * URLhaus Bulk CSV download URL (abuse.ch).
 * Public, no API key required. ~2MB compressed, ~2400 active malicious domains.
 */
const URLHAUS_CSV_URL = "https://urlhaus.abuse.ch/downloads/csv/";

export class Blocklist {
	private domains: Set<string> = new Set();
	private timer: ReturnType<typeof setInterval> | null = null;
	private config: BlocklistConfig;

	constructor(config: BlocklistConfig) {
		this.config = config;
	}

	/**
	 * Initialize blocklist. Starts background update timer.
	 * Call once at plugin startup.
	 */
	async init(): Promise<void> {
		if (!this.config.enabled) return;

		await this.update();

		if (this.config.updateIntervalMs > 0) {
			this.timer = setInterval(() => {
				void this.update();
			}, this.config.updateIntervalMs);

			// Don't block process exit
			if (this.timer.unref) {
				this.timer.unref();
			}
		}
	}

	/**
	 * Fetch and update the blocklist. Fails open on error.
	 */
	async update(): Promise<void> {
		// Use custom source if provided
		if (this.config.customSource) {
			this.domains = new Set(this.config.customSource);
			this.applyExtraDomains();
			return;
		}

		try {
			const response = await fetch(URLHAUS_CSV_URL, {
				headers: { "User-Agent": "pi/webfetch" },
				signal: AbortSignal.timeout(30_000),
			});

			if (!response.ok) return;

			const text = await response.text();
			this.domains = parseUrlhausCsv(text);
			this.applyExtraDomains();
		} catch {
			// Fail open: keep existing (or empty) set
		}
	}

	/** Check if a hostname is blocked. */
	isBlocked(hostname: string): boolean {
		if (!this.config.enabled) return false;
		return this.domains.has(hostname.toLowerCase());
	}

	destroy(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	private applyExtraDomains(): void {
		if (this.config.extraDomains) {
			for (const d of this.config.extraDomains) {
				this.domains.add(d.toLowerCase());
			}
		}
	}
}

/**
 * Parse URLhaus bulk CSV and return a Set of active malicious hostnames.
 * CSV columns: id, dateadded, url, url_status, last_online, threat, tags, urlhaus_link, reporter
 */
function parseUrlhausCsv(csv: string): Set<string> {
	const domains = new Set<string>();
	const lines = csv.split("\n");

	for (const line of lines) {
		// Skip comment lines and blank lines
		if (line.startsWith("#") || line.trim() === "") continue;

		const parts = parseCsvLine(line);
		if (parts.length < 4) continue;

		const urlStr = parts[2];
		const status = parts[3];

		// Only include active/online entries
		if (status !== "online") continue;

		try {
			const parsed = new URL(urlStr);
			domains.add(parsed.hostname.toLowerCase());
		} catch {
			// Skip invalid URLs
		}
	}

	return domains;
}

/** Minimal RFC-4180 CSV line parser (handles quoted fields). */
function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];

		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote inside quoted field
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === "," && !inQuotes) {
			result.push(current);
			current = "";
		} else {
			current += ch;
		}
	}

	result.push(current);
	return result;
}
