#!/usr/bin/env node
/**
 * Static server for the ElevenLabs embed example + signed-URL proxy.
 * Usage: PORT=4006 node server.mjs
 *        (or from repo root via ./start)
 *
 * POST /api/elevenlabs-signed-url  { agentId, apiKey }
 * → proxies to ElevenLabs get-signed-url (avoids browser CORS; demo-only).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4006);
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

async function handleSignedUrl(req, res) {
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

	let agentId = '';
	let apiKey = '';
	try {
		const parsed = JSON.parse(await readBody(req));
		agentId = String(parsed.agentId ?? '').trim();
		apiKey = String(parsed.apiKey ?? '').trim();
	} catch {
		json(res, 400, { error: 'Invalid JSON body' });
		return;
	}

	// Prefer a key from the request; fall back to local env for developers who
	// don't want to paste secrets into the browser form.
	if (!apiKey) {
		apiKey = String(process.env.ELEVENLABS_API_KEY ?? '').trim();
	}

	// Same cleanup as the browser form (quotes / Bearer / zero-width chars).
	apiKey = apiKey
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
	agentId = agentId.trim();

	if (!agentId) {
		json(res, 400, { error: 'agentId is required' });
		return;
	}
	if (!apiKey) {
		json(res, 400, {
			error:
				'apiKey is required (paste in the form, or set ELEVENLABS_API_KEY when starting the server)'
		});
		return;
	}

	const keyMeta = {
		length: apiKey.length,
		prefix: apiKey.slice(0, 3),
		suffix: apiKey.slice(-4),
		startsWithSk: apiKey.startsWith('sk_')
	};

	const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
	url.searchParams.set('agent_id', agentId);

	const upstream = await fetch(url, {
		headers: { 'xi-api-key': apiKey }
	});

	const text = await upstream.text();
	if (!upstream.ok) {
		let elevenCode = '';
		let elevenMessage = '';
		try {
			const parsed = JSON.parse(text);
			elevenCode = String(parsed?.detail?.status ?? parsed?.detail?.code ?? '');
			elevenMessage = String(parsed?.detail?.message ?? '');
		} catch {
			/* ignore */
		}
		json(res, upstream.status, {
			error: 'ElevenLabs signed URL request failed',
			detail: text.slice(0, 500),
			elevenCode,
			elevenMessage,
			keyMeta
		});
		return;
	}

	let signedUrl = '';
	try {
		const data = JSON.parse(text);
		signedUrl = String(data.signed_url ?? data.signedUrl ?? '').trim();
	} catch {
		json(res, 502, { error: 'Unexpected ElevenLabs response' });
		return;
	}

	if (!signedUrl) {
		json(res, 502, { error: 'ElevenLabs response missing signed_url' });
		return;
	}

	json(res, 200, { signedUrl });
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
		if (pathOnly === '/api/elevenlabs-signed-url') {
			await handleSignedUrl(req, res);
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
	console.log(`ElevenLabs embed → http://${host}:${port}/ (${label})`);
	console.log(`Signed-URL proxy: POST /api/elevenlabs-signed-url`);
});
