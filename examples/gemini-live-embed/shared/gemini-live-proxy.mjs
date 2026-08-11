/**
 * Shared Gemini Live (BidiGenerateContent) WebSocket proxy for local demos.
 *
 * Browser: `new WebSocket(proxyUrl)` (no API key in the client).
 * Server: upgrade → Google Live WS with `?key=` server-side, injects setup, then
 * bidirectional JSON passthrough.
 *
 * Upstream:
 *   wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=…
 *
 * Docs: https://ai.google.dev/gemini-api/docs/live-api
 *       https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/google
 *
 * Demo-only — replace with a real backend in production.
 */
import { WebSocketServer, WebSocket } from 'ws';

export const GEMINI_LIVE_UPSTREAM =
	'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export const DEFAULT_PROXY_PATH = '/api/gemini-live';
export const PROXY_READY_PATH = '/api/gemini-proxy-ready';

/** Override with GEMINI_LIVE_MODEL. Must be a Live-capable model id. */
export const DEFAULT_GEMINI_LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';

/**
 * Coffee-barista system instruction (same roleplay as other BYO demos).
 * Override with GEMINI_LIVE_SYSTEM_INSTRUCTION if needed.
 */
export const DEFAULT_SYSTEM_INSTRUCTION = `You are Anna, a friendly barista at London Coffee, a cosy café in London. You speak through an animated avatar standing behind the service counter.

Role:
- You are helping a customer practise ordering in English at B1 level.
- The customer is a language learner who may be from any country; use clear international English and be patient.
- Speak at B1 level: natural, short sentences; avoid rare idioms and overly complex grammar.

Character:
- Warm, professional, and efficient — like a real barista during a busy but relaxed morning.
- You know the menu on the chalkboards behind you (coffee classics, flavoured lattes, matcha, chai, pastries).
- You may briefly confirm choices and suggest popular items when the customer is unsure.

Boundaries:
- Do not say you are an AI, language model, or chatbot.
- Stay in character as Anna the barista at London Coffee.
- Keep prices simple and plausible in pounds (£); you do not need exact prices on every item.

Speaking style:
- Usually 1–2 sentences per turn.
- Ask one clear question at a time when you need more information (drink type, size, milk, pastry choice, eat-in or takeaway).

Your goal is to run a short B1 roleplay where the customer orders a coffee and a pastry (you do not announce these objectives aloud):

1. Greet the customer and invite them to order.
2. Help them choose and confirm a coffee (type, size, and milk or extras if relevant).
3. Help them choose and confirm a pastry from the display.
4. Confirm the full order clearly and state a simple total in pounds.
5. Close politely — thank them and say their order will be ready shortly (or hand it over if they chose takeaway).

Conversation strategy:
- On your **first** assistant turn, greet the customer warmly and ask what you can get them — in one short spoken reply. Do not wait for the customer to speak first.
- On later turns, respond to what they said; never repeat your full introduction.
- If they only order coffee first, gently ask if they would like a pastry too (or vice versa) before closing.
- If their order is unclear, offer two simple options from the menu (e.g. "Would you like a latte or a flat white?").
- When both items are chosen and confirmed, give the total and a friendly closing. Do not ask more questions after closing.

If the customer does not understand:
- Rephrase more simply and offer one short example ("For example, a medium cappuccino and a croissant.").

Output for voice:
- Speak only words the customer should hear. No stage directions, markdown, or bullet lists.`;

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeGeminiApiKey(raw) {
	return String(raw ?? '')
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

/**
 * Resolve API key from query string or GEMINI_API_KEY / GOOGLE_API_KEY env.
 * @param {string | null | undefined} queryKey
 * @returns {string}
 */
export function resolveGeminiApiKey(queryKey) {
	const fromQuery = normalizeGeminiApiKey(queryKey);
	if (fromQuery) return fromQuery;
	const fromGemini = normalizeGeminiApiKey(process.env.GEMINI_API_KEY);
	if (fromGemini) return fromGemini;
	return normalizeGeminiApiKey(process.env.GOOGLE_API_KEY);
}

/**
 * @returns {string}
 */
export function resolveGeminiLiveModel() {
	const raw = String(process.env.GEMINI_LIVE_MODEL ?? DEFAULT_GEMINI_LIVE_MODEL).trim();
	if (!raw) return DEFAULT_GEMINI_LIVE_MODEL;
	return raw.startsWith('models/') ? raw : `models/${raw}`;
}

/**
 * First client message required by Gemini Live after the socket opens.
 * @returns {Record<string, unknown>}
 */
export function buildGeminiLiveSetup() {
	const systemText =
		String(process.env.GEMINI_LIVE_SYSTEM_INSTRUCTION ?? DEFAULT_SYSTEM_INSTRUCTION).trim() ||
		DEFAULT_SYSTEM_INSTRUCTION;

	return {
		setup: {
			model: resolveGeminiLiveModel(),
			generationConfig: {
				responseModalities: ['AUDIO'],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: {
							voiceName: String(process.env.GEMINI_LIVE_VOICE ?? 'Puck').trim() || 'Puck'
						}
					}
				}
			},
			systemInstruction: {
				parts: [{ text: systemText }]
			},
			// Enables outputTranscription used by connectGeminiLive for lipsync.
			outputAudioTranscription: {}
		}
	};
}

/**
 * Attach upgrade handler for Gemini Live proxy.
 * @param {import('node:http').Server} httpServer
 * @param {{ path?: string }} [options]
 */
export function attachGeminiLiveProxy(httpServer, options = {}) {
	const path = options.path ?? DEFAULT_PROXY_PATH;

	const wss = new WebSocketServer({ noServer: true });

	httpServer.on('upgrade', (req, socket, head) => {
		const url = new URL(req.url ?? '/', 'http://localhost');
		if (url.pathname !== path) return;

		const apiKey = resolveGeminiApiKey(url.searchParams.get('apiKey'));
		if (!apiKey) {
			socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (client) => {
			const upstreamUrl = `${GEMINI_LIVE_UPSTREAM}?key=${encodeURIComponent(apiKey)}`;
			const upstream = new WebSocket(upstreamUrl);

			/** @type {Buffer[] | string[]} */
			const pendingClient = [];
			let setupSent = false;
			let setupComplete = false;

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

			const flushPending = () => {
				if (!setupComplete || upstream.readyState !== WebSocket.OPEN) return;
				while (pendingClient.length > 0) {
					const msg = pendingClient.shift();
					if (msg != null) upstream.send(msg);
				}
			};

			upstream.on('open', () => {
				try {
					upstream.send(JSON.stringify(buildGeminiLiveSetup()));
					setupSent = true;
				} catch {
					closeBoth();
				}
			});

			upstream.on('message', (data, isBinary) => {
				if (!isBinary) {
					const text = typeof data === 'string' ? data : data.toString('utf8');
					try {
						const msg = JSON.parse(text);
						if ('setupComplete' in msg || (setupSent && msg.serverContent)) {
							setupComplete = true;
							flushPending();
						}
					} catch {
						/* passthrough non-JSON */
					}
				}
				if (client.readyState !== WebSocket.OPEN) return;
				client.send(data, { binary: isBinary });
			});

			client.on('message', (data, isBinary) => {
				if (upstream.readyState !== WebSocket.OPEN || !setupComplete) {
					pendingClient.push(isBinary ? data : data.toString());
					return;
				}
				upstream.send(data, { binary: isBinary });
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
 * Handle POST /api/gemini-proxy-ready — validates key (form or env) before arming.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {Promise<boolean>} true if handled
 */
export async function handleGeminiProxyReady(req, res) {
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
			bodyKey = normalizeGeminiApiKey(parsed.apiKey);
		}
	} catch {
		json(res, 400, { error: 'Invalid JSON body' });
		return true;
	}

	const envKey = resolveGeminiApiKey(null);
	const apiKey = bodyKey || envKey;

	if (!apiKey) {
		json(res, 400, {
			error:
				'apiKey is required (paste in the form, or set GEMINI_API_KEY / GOOGLE_API_KEY when starting the server)'
		});
		return true;
	}

	json(res, 200, {
		ok: true,
		/** When true, client may omit ?apiKey= and rely on server env. */
		useEnvKey: !bodyKey && Boolean(envKey),
		proxyPath: DEFAULT_PROXY_PATH,
		model: resolveGeminiLiveModel()
	});
	return true;
}

/**
 * Connect middleware for Vite / plain Node that handles POST proxy-ready.
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => void}
 */
export function createGeminiProxyReadyMiddleware() {
	return (req, res, next) => {
		const pathOnly = (req.url ?? '/').split('?')[0] ?? '/';
		if (pathOnly !== PROXY_READY_PATH) {
			next();
			return;
		}
		void handleGeminiProxyReady(req, res).catch((err) => {
			console.error(err);
			if (!res.headersSent) {
				json(res, 500, { error: 'Internal error' });
			}
		});
	};
}
