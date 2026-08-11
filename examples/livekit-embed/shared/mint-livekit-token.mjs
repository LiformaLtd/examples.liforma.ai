/**
 * Shared LiveKit participant-token mint for local demos.
 *
 * Env (required):
 *   LIVEKIT_URL          — wss://… LiveKit server URL
 *   LIVEKIT_API_KEY      — API key
 *   LIVEKIT_API_SECRET   — API secret
 *
 * Optional body: { roomName?, identity?, ttlSeconds? }
 * Returns: { url, token, roomName, identity }
 *
 * Demo-only — replace with a real backend in production.
 */
import { AccessToken } from 'livekit-server-sdk';

export const TOKEN_PATH = '/api/livekit-token';

export const DEFAULT_ROOM_NAME = 'liforma-coffee-barista';
export const DEFAULT_IDENTITY = 'listener';
export const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeEnv(raw) {
	return String(raw ?? '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

/**
 * @returns {{ url: string; apiKey: string; apiSecret: string } | { error: string }}
 */
export function resolveLiveKitCredentials() {
	const url = normalizeEnv(process.env.LIVEKIT_URL);
	const apiKey = normalizeEnv(process.env.LIVEKIT_API_KEY);
	const apiSecret = normalizeEnv(process.env.LIVEKIT_API_SECRET);

	if (!url || !apiKey || !apiSecret) {
		return {
			error:
				'Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET when starting the server (see README)'
		};
	}
	return { url, apiKey, apiSecret };
}

/**
 * @param {{ roomName?: string; identity?: string; ttlSeconds?: number }} [opts]
 * @returns {Promise<{ url: string; token: string; roomName: string; identity: string }>}
 */
export async function mintLiveKitToken(opts = {}) {
	const creds = resolveLiveKitCredentials();
	if ('error' in creds) {
		const err = new Error(creds.error);
		/** @type {Error & { status?: number }} */
		const e = err;
		e.status = 400;
		throw e;
	}

	const roomName = normalizeEnv(opts.roomName) || DEFAULT_ROOM_NAME;
	const identity = normalizeEnv(opts.identity) || DEFAULT_IDENTITY;
	const ttl =
		typeof opts.ttlSeconds === 'number' && opts.ttlSeconds > 0
			? opts.ttlSeconds
			: DEFAULT_TTL_SECONDS;

	const at = new AccessToken(creds.apiKey, creds.apiSecret, {
		identity,
		ttl
	});
	at.addGrant({
		roomJoin: true,
		room: roomName,
		canSubscribe: true,
		canPublish: false,
		canPublishData: false
	});

	const token = await at.toJwt();
	return {
		url: creds.url,
		token,
		roomName,
		identity
	};
}

/**
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
 * Handle POST /api/livekit-token
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {Promise<boolean>} true if handled
 */
export async function handleLiveKitToken(req, res) {
	const pathOnly = (req.url ?? '/').split('?')[0] ?? '/';
	if (pathOnly !== TOKEN_PATH) return false;

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

	/** @type {{ roomName?: string; identity?: string; ttlSeconds?: number }} */
	let body = {};
	try {
		const raw = await readBody(req);
		if (raw.trim()) {
			body = JSON.parse(raw);
		}
	} catch {
		json(res, 400, { error: 'Invalid JSON body' });
		return true;
	}

	try {
		const minted = await mintLiveKitToken(body);
		json(res, 200, minted);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const status =
			err && typeof err === 'object' && 'status' in err && typeof err.status === 'number'
				? err.status
				: 500;
		json(res, status, { error: message });
	}
	return true;
}

/**
 * Connect middleware for Vite / plain Node that handles POST token mint.
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => void}
 */
export function createLiveKitTokenMiddleware() {
	return (req, res, next) => {
		const pathOnly = (req.url ?? '/').split('?')[0] ?? '/';
		if (pathOnly !== TOKEN_PATH) {
			next();
			return;
		}
		void handleLiveKitToken(req, res).catch((err) => {
			console.error(err);
			if (!res.headersSent) {
				json(res, 500, { error: 'Internal error' });
			}
		});
	};
}
