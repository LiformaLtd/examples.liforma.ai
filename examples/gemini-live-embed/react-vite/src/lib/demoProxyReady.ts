/**
 * Demo-only: ask the local server whether a Gemini API key is available (form or env).
 */

export class DemoProxyReadyError extends Error {
	readonly status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'DemoProxyReadyError';
		this.status = status;
	}
}

export type DemoProxyReadyResult = {
	ok: true;
	useEnvKey: boolean;
	proxyPath: string;
};

export async function fetchDemoProxyReady(apiKey: string): Promise<DemoProxyReadyResult> {
	const res = await fetch('/api/gemini-proxy-ready', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey: apiKey || undefined })
	});

	const text = await res.text();
	let data: { error?: string; useEnvKey?: boolean; proxyPath?: string } = {};
	try {
		data = text ? (JSON.parse(text) as typeof data) : {};
	} catch {
		/* ignore */
	}

	if (!res.ok) {
		throw new DemoProxyReadyError(
			String(data.error ?? `Gemini proxy ready failed (${res.status})`),
			res.status
		);
	}

	return {
		ok: true,
		useEnvKey: Boolean(data.useEnvKey),
		proxyPath: String(data.proxyPath ?? '/api/gemini-live')
	};
}

export function buildGeminiProxyUrl(opts: {
	apiKey?: string;
	useEnvKey?: boolean;
	proxyPath?: string;
}): string {
	const path = opts.proxyPath ?? '/api/gemini-live';
	const proto = location.protocol === 'https:' ? 'wss' : 'ws';
	const base = `${proto}://${location.host}${path}`;
	const key = String(opts.apiKey ?? '').trim();
	if (opts.useEnvKey || !key) return base;
	return `${base}?apiKey=${encodeURIComponent(key)}`;
}
