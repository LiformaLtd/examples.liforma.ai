#!/usr/bin/env node
/**
 * Static server for one vanilla example directory.
 * Usage: PORT=4001 node scripts/serve-example.mjs [directory]
 *
 * Local SDK (unpublished features): set LIFORMA_STACK=local, or open with ?stack=local.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const root = resolve(process.argv[2] ?? process.cwd());
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
	'.ico': 'image/x-icon'
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

	if (ext === '.html') {
		const injected = prepareHtml(data.toString('utf8'), local);
		res.writeHead(200, { 'Content-Type': MIME['.html'] });
		res.end(injected);
		return;
	}

	res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
	res.end(data);
}

createServer(async (req, res) => {
	try {
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
	console.log(`Serving ${root} → http://${host}:${port}/ (${label})`);
});
