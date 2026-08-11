/**
 * Shared Deepgram Voice Agent WebSocket proxy for local demos.
 *
 * Browser: `new WebSocket(proxyUrl)` (no Authorization header).
 * Server: upgrade → `wss://agent.deepgram.com/v1/agent/converse` with
 * `Authorization: Token <DEEPGRAM_API_KEY>`, bidirectional binary + text passthrough.
 *
 * Demo-only — replace with a real backend in production.
 */
import { WebSocketServer, WebSocket } from 'ws';

export const DEEPGRAM_AGENT_UPSTREAM = 'wss://agent.deepgram.com/v1/agent/converse';
export const DEFAULT_PROXY_PATH = '/api/deepgram-agent';
export const PROXY_READY_PATH = '/api/deepgram-proxy-ready';

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeDeepgramApiKey(raw) {
	return String(raw ?? '')
		.replace(/^Token\s+/i, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

/**
 * Resolve API key from query string or process.env.DEEPGRAM_API_KEY.
 * @param {string | null | undefined} queryKey
 * @returns {string}
 */
export function resolveDeepgramApiKey(queryKey) {
	const fromQuery = normalizeDeepgramApiKey(queryKey);
	if (fromQuery) return fromQuery;
	return normalizeDeepgramApiKey(process.env.DEEPGRAM_API_KEY);
}

/**
 * Attach upgrade handler for Deepgram Voice Agent proxy.
 * @param {import('node:http').Server} httpServer
 * @param {{ path?: string }} [options]
 */
export function attachDeepgramAgentProxy(httpServer, options = {}) {
	const path = options.path ?? DEFAULT_PROXY_PATH;

	const wss = new WebSocketServer({ noServer: true });

	httpServer.on('upgrade', (req, socket, head) => {
		const url = new URL(req.url ?? '/', 'http://localhost');
		if (url.pathname !== path) return;

		const apiKey = resolveDeepgramApiKey(url.searchParams.get('apiKey'));
		if (!apiKey) {
			socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (client) => {
			const upstream = new WebSocket(DEEPGRAM_AGENT_UPSTREAM, {
				headers: {
					Authorization: `Token ${apiKey}`
				}
			});

			const closeBoth = () => {
				try {
					if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
						client.close();
					}
				} catch {
					/* ignore */
				}
				try {
					if (
						upstream.readyState === WebSocket.OPEN ||
						upstream.readyState === WebSocket.CONNECTING
					) {
						upstream.close();
					}
				} catch {
					/* ignore */
				}
			};

			upstream.on('open', () => {
				client.on('message', (data, isBinary) => {
					if (upstream.readyState !== WebSocket.OPEN) return;
					upstream.send(data, { binary: isBinary });
				});
			});

			upstream.on('message', (data, isBinary) => {
				if (client.readyState !== WebSocket.OPEN) return;
				client.send(data, { binary: isBinary });
			});

			upstream.on('close', closeBoth);
			upstream.on('error', closeBoth);
			client.on('close', closeBoth);
			client.on('error', closeBoth);
		});
	});

	return { path };
}

/**
 * JSON body reader for Node http.IncomingMessage.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {Record<string, unknown>} body
 */
function json(res, status, body) {
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store'
	});
	res.end(JSON.stringify(body));
}

/**
 * Handle POST /api/deepgram-proxy-ready — validates key (form or env) before arming.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {Promise<boolean>} true if handled
 */
export async function handleDeepgramProxyReady(req, res) {
	const pathOnly = (req.url ?? '/').split('?')[0] ?? '/';
	if (pathOnly !== PROXY_READY_PATH) return false;

	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});
		res.end();
		return true;
	}

	if (req.method !== 'POST') {
		json(res, 405, { error: 'Method not allowed' });
		return true;
	}

	let bodyKey = '';
	try {
		const raw = await readBody(req);
		if (raw.trim()) {
			const parsed = JSON.parse(raw);
			bodyKey = normalizeDeepgramApiKey(parsed.apiKey);
		}
	} catch {
		json(res, 400, { error: 'Invalid JSON body' });
		return true;
	}

	const envKey = normalizeDeepgramApiKey(process.env.DEEPGRAM_API_KEY);
	const apiKey = bodyKey || envKey;

	if (!apiKey) {
		json(res, 400, {
			error:
				'apiKey is required (paste in the form, or set DEEPGRAM_API_KEY when starting the server)'
		});
		return true;
	}

	json(res, 200, {
		ok: true,
		/** When true, client may omit ?apiKey= and rely on server env. */
		useEnvKey: !bodyKey && Boolean(envKey),
		proxyPath: DEFAULT_PROXY_PATH
	});
	return true;
}

/**
 * Connect middleware for Vite / plain Node that handles POST proxy-ready.
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => void}
 */
export function createDeepgramProxyReadyMiddleware() {
	return (req, res, next) => {
		const pathOnly = (req.url ?? '/').split('?')[0] ?? '/';
		if (pathOnly !== PROXY_READY_PATH) {
			next();
			return;
		}
		void handleDeepgramProxyReady(req, res).catch((err) => {
			console.error(err);
			if (!res.headersSent) {
				json(res, 500, { error: 'Internal error' });
			}
		});
	};
}
