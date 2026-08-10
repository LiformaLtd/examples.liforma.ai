#!/usr/bin/env node
/**
 * Static server for the OpenAI Realtime embed example + ephemeral client-secret mint.
 * Usage: PORT=4007 node server.mjs
 *        (or from repo root via ./start)
 *
 * POST /api/openai-realtime-session  { apiKey? }
 * → proxies to OpenAI /v1/realtime/client_secrets (demo-only).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	DEFAULT_REALTIME_MODEL,
	DEFAULT_REALTIME_VOICE,
	SUGGESTED_INSTRUCTIONS
} from './config.js';

const port = Number(process.env.PORT || 4007);
const host = process.env.HOST || '127.0.0.1';
const root = resolve(dirname(fileURLToPath(import.meta.url)));
const envLocal = process.env.LIFORMA_STACK === 'local';

const PRODUCTION_SDK = 'https://cdn.liforma.ai/sdk/v2/client.js';
const LOCAL_SDK = 'http://localhost:3010/sdk/v2/client.js';

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.md': 'text/markdown; charset=utf-8'
};

function requestWantsLocalStack(url) {
	if (envLocal) return true;
	try {
		const q = (url ?? '').split('?')[1] ?? '';
		return new URLSearchParams(q).get('stack') === 'local';
	} catch {
		return false;
	}
}

function safeFileInDir(dir, relativePath) {
	const filePath = resolve(join(dir, relativePath));
	if (filePath !== dir && !filePath.startsWith(dir + sep)) return null;
	return filePath;
}

function resolveRequestPath(urlPath) {
	const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/');
	const relative =
		decoded === '/' || decoded === '' ? 'index.html' : decoded.replace(/^\/+/, '');
	return safeFileInDir(root, relative);
}

function prepareHtml(html, local) {
	if (!local) return html;
	let out = html.split(PRODUCTION_SDK).join(LOCAL_SDK);
	const inject = '<script>window.__LIFORMA_STACK="local";</script>';
	return out.includes('</head>') ? out.replace('</head>', `${inject}</head>`) : `${inject}${out}`;
}

function readBody(req) {
	return new Promise((resolveBody, reject) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
		req.on('error', reject);
	});
}

function json(res, status, body) {
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store'
	});
	res.end(JSON.stringify(body));
}

function normalizeApiKey(raw) {
	return String(raw ?? '')
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

async function handleClientSecret(req, res) {
	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});
		res.end();
		return;
	}

	if (req.method !== 'POST') {
		json(res, 405, { error: 'Method not allowed' });
		return;
	}

	let apiKey = '';
	try {
		const parsed = JSON.parse(await readBody(req));
		apiKey = normalizeApiKey(parsed.apiKey);
	} catch {
		json(res, 400, { error: 'Invalid JSON body' });
		return;
	}

	if (!apiKey) {
		apiKey = normalizeApiKey(process.env.OPENAI_API_KEY);
	}

	if (!apiKey) {
		json(res, 400, {
			error:
				'apiKey is required (paste in the form, or set OPENAI_API_KEY when starting the server)'
		});
		return;
	}

	const model = String(process.env.OPENAI_REALTIME_MODEL ?? DEFAULT_REALTIME_MODEL).trim();
	const voice = String(process.env.OPENAI_REALTIME_VOICE ?? DEFAULT_REALTIME_VOICE).trim();

	const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'OpenAI-Safety-Identifier': 'liforma-examples-openai-realtime-embed'
		},
		body: JSON.stringify({
			session: {
				type: 'realtime',
				model,
				instructions: SUGGESTED_INSTRUCTIONS,
				audio: {
					output: {
						voice
					}
				}
			}
		})
	});

	const text = await upstream.text();
	if (!upstream.ok) {
		json(res, upstream.status, {
			error: 'OpenAI client_secrets request failed',
			detail: text.slice(0, 500)
		});
		return;
	}

	let value = '';
	try {
		const data = JSON.parse(text);
		value = String(data.value ?? data.client_secret?.value ?? '').trim();
	} catch {
		json(res, 502, { error: 'Unexpected OpenAI response' });
		return;
	}

	if (!value) {
		json(res, 502, { error: 'OpenAI response missing client secret value' });
		return;
	}

	json(res, 200, { value, model, voice });
}

async function sendFile(filePath, res, local) {
	const data = await readFile(filePath);
	const ext = extname(filePath);
	const noStore = { 'Cache-Control': 'no-store' };

	if (ext === '.html') {
		const injected = prepareHtml(data.toString('utf8'), local);
		res.writeHead(200, { 'Content-Type': MIME['.html'], ...noStore });
		res.end(injected);
		return;
	}

	res.writeHead(200, {
		'Content-Type': MIME[ext] ?? 'application/octet-stream',
		...(ext === '.js' || ext === '.css' ? noStore : {})
	});
	res.end(data);
}

createServer(async (req, res) => {
	try {
		const pathOnly = (req.url ?? '/').split('?')[0] ?? '/';
		if (pathOnly === '/api/openai-realtime-session') {
			await handleClientSecret(req, res);
			return;
		}

		const local = requestWantsLocalStack(req.url);
		const filePath = resolveRequestPath(req.url ?? '/');
		if (!filePath) {
			res.writeHead(403);
			res.end('Forbidden');
			return;
		}
		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) {
			res.writeHead(404);
			res.end('Not found');
			return;
		}
		await sendFile(filePath, res, local);
	} catch {
		res.writeHead(404);
		res.end('Not found');
	}
}).listen(port, host, () => {
	const label = envLocal
		? 'local Liforma stack (LIFORMA_STACK=local)'
		: 'production SDK by default; ?stack=local → localhost:3010';
	console.log(`OpenAI Realtime embed → http://${host}:${port}/ (${label})`);
	console.log(`Client-secret mint: POST /api/openai-realtime-session`);
});
