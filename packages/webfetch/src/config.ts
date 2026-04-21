export interface BlocklistConfig {
	enabled: boolean;
	extraDomains?: string[];
	customSource?: Set<string>;
	updateIntervalMs: number;
}

export interface CacheConfig {
	maxSizeBytes: number;
	ttlMs: number;
}

export interface WebFetchConfig {
	/**
	 * Content length threshold (chars) above which LLM refinement is triggered.
	 * Set to Infinity to disable refinement, 0 to always refine.
	 * Default: 50000
	 */
	refinementThreshold: number;

	/**
	 * Default maximum chars returned per paginated page.
	 * Default: 20000
	 */
	maxPageLength: number;

	blocklist: BlocklistConfig;
	cache: CacheConfig;
}

export const DEFAULT_CONFIG: WebFetchConfig = {
	refinementThreshold: 50000,
	maxPageLength: 20000,
	blocklist: {
		enabled: true,
		updateIntervalMs: 24 * 60 * 60 * 1000,
	},
	cache: {
		maxSizeBytes: 50 * 1024 * 1024,
		ttlMs: 15 * 60 * 1000,
	},
};

export function mergeConfig(partial?: Partial<WebFetchConfig>): WebFetchConfig {
	if (!partial) return DEFAULT_CONFIG;
	return {
		refinementThreshold: partial.refinementThreshold ?? DEFAULT_CONFIG.refinementThreshold,
		maxPageLength: partial.maxPageLength ?? DEFAULT_CONFIG.maxPageLength,
		blocklist: { ...DEFAULT_CONFIG.blocklist, ...partial.blocklist },
		cache: { ...DEFAULT_CONFIG.cache, ...partial.cache },
	};
}
