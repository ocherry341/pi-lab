import { LRUCache } from "lru-cache";
import type { CacheConfig } from "./config.js";

export class WebFetchCache {
	private cache: LRUCache<string, string>;

	constructor(config: CacheConfig) {
		this.cache = new LRUCache<string, string>({
			// Byte-based size limit
			maxSize: config.maxSizeBytes,
			sizeCalculation: (value: string) => Buffer.byteLength(value, "utf8"),
			// TTL per entry
			ttl: config.ttlMs,
			allowStale: false,
		});
	}

	get(key: string): string | undefined {
		return this.cache.get(key);
	}

	set(key: string, value: string): void {
		this.cache.set(key, value);
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}
}
