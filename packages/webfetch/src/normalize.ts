/**
 * Normalize a URL in a lossless way:
 * 1. Lowercase protocol
 * 2. Lowercase hostname
 * 3. Upgrade http → https
 * 4. Remove default ports (:80 for http, :443 for https)
 *
 * Does NOT reorder query params or normalize trailing slashes.
 */
export function normalizeUrl(rawUrl: string): string {
	const url = new URL(rawUrl);

	url.protocol = url.protocol.toLowerCase();
	url.hostname = url.hostname.toLowerCase();

	// Upgrade http → https
	if (url.protocol === "http:") {
		url.protocol = "https:";
	}

	// Remove default ports
	if (url.port === "443" && url.protocol === "https:") {
		url.port = "";
	}
	if (url.port === "80" && url.protocol === "http:") {
		url.port = "";
	}

	return url.toString();
}
