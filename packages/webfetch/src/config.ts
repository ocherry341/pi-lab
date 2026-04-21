export interface CacheConfig {
	maxSizeBytes: number;
	ttlMs: number;
}

export interface WebFetchConfig {
	/**
	 * Default maximum chars returned per paginated page.
	 * Default: 20000
	 */
	maxPageLength: number;
	cache: CacheConfig;
}

export const DEFAULT_CONFIG: WebFetchConfig = {
	maxPageLength: 20000,
	cache: {
		maxSizeBytes: 50 * 1024 * 1024,
		ttlMs: 15 * 60 * 1000,
	},
};

export function mergeConfig(partial?: Partial<WebFetchConfig>): WebFetchConfig {
	if (!partial) return DEFAULT_CONFIG;
	return {
		maxPageLength: partial.maxPageLength ?? DEFAULT_CONFIG.maxPageLength,
		cache: { ...DEFAULT_CONFIG.cache, ...partial.cache },
	};
}
