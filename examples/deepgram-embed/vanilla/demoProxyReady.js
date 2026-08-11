/**
 * Demo-only: ask the local server whether a Deepgram API key is available (form or env).
 */

export class DemoProxyReadyError extends Error {
	/**
	 * @param {string} message
	 * @param {number} [status]
	 */
	constructor(message, status) {
		super(message);
		this.name = 'DemoProxyReadyError';
		this.status = status;
	}
}

/**
 * @param {string} apiKey form value (may be empty if DEEPGRAM_API_KEY is set on the server)
 * @returns {Promise<{ ok: true; useEnvKey: boolean; proxyPath: string }>}
 */
export async function fetchDemoProxyReady(apiKey) {
	const res = await fetch('/api/deepgram-proxy-ready', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey: apiKey || undefined })
	});

	const text = await res.text();
	let data = {};
	try {
		data = text ? JSON.parse(text) : {};
	} catch {
		/* ignore */
	}

	if (!res.ok) {
		throw new DemoProxyReadyError(
			String(data.error ?? `Deepgram proxy ready failed (${res.status})`),
			res.status
		);
	}

	return {
		ok: true,
		useEnvKey: Boolean(data.useEnvKey),
		proxyPath: String(data.proxyPath ?? '/api/deepgram-agent')
	};
}

/**
 * Build same-origin WebSocket URL for the Deepgram agent proxy.
 * @param {{ apiKey?: string; useEnvKey?: boolean; proxyPath?: string }} opts
 */
export function buildDeepgramProxyUrl(opts = {}) {
	const path = opts.proxyPath ?? '/api/deepgram-agent';
	const proto = location.protocol === 'https:' ? 'wss' : 'ws';
	const base = `${proto}://${location.host}${path}`;
	const key = String(opts.apiKey ?? '').trim();
	if (opts.useEnvKey || !key) return base;
	return `${base}?apiKey=${encodeURIComponent(key)}`;
}
