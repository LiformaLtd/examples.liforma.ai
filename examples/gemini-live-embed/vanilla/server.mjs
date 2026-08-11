#!/usr/bin/env node
/**
 * Static server for the Gemini Live embed example + WebSocket proxy.
 * Usage: PORT=4010 node server.mjs
 *        (or from repo root via ./start)
 *
 * WS  /api/gemini-live[?apiKey=…]  → Gemini agent.converse (Authorization on server)
 * POST /api/gemini-proxy-ready       → validate key (form or GEMINI_API_KEY)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	attachGeminiLiveProxy,
	handleGeminiProxyReady
} from '../shared/gemini-live-proxy.mjs';

const port = Number(process.env.PORT || 4010);
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
	'.mjs': 'text/javascript; charset=utf-8',
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
		...(ext === '.js' || ext === '.css' || ext === '.mjs' ? noStore : {})
	});
	res.end(data);
}

const server = createServer(async (req, res) => {
	try {
		if (await handleGeminiProxyReady(req, res)) return;

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
});

attachGeminiLiveProxy(server);

server.listen(port, host, () => {
	const label = envLocal
		? 'local Liforma stack (LIFORMA_STACK=local)'
		: 'production SDK by default; ?stack=local → localhost:3010';
	console.log(`Gemini Live embed → http://${host}:${port}/ (${label})`);
	console.log(`WS proxy: /api/gemini-live  |  ready: POST /api/gemini-proxy-ready`);
});
