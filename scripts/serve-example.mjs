#!/usr/bin/env node
/**
 * Static server for one vanilla example directory.
 * Usage: PORT=4001 node scripts/serve-example.mjs [directory]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const root = resolve(process.argv[2] ?? process.cwd());
const stack = process.env.LIFORMA_STACK === 'local' ? 'local' : 'production';

const INJECT_TAG =
	stack === 'local' ? '<script>window.__LIFORMA_STACK="local";</script>' : '';

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon'
};

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

async function sendFile(filePath, res) {
	const data = await readFile(filePath);
	const ext = extname(filePath);

	if (ext === '.html' && INJECT_TAG) {
		const html = data.toString('utf8');
		const injected = html.includes('</head>')
			? html.replace('</head>', `${INJECT_TAG}</head>`)
			: `${INJECT_TAG}${html}`;
		res.writeHead(200, { 'Content-Type': MIME['.html'] });
		res.end(injected);
		return;
	}

	res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
	res.end(data);
}

createServer(async (req, res) => {
	try {
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
		await sendFile(filePath, res);
	} catch {
		res.writeHead(404);
		res.end('Not found');
	}
}).listen(port, host, () => {
	const label = stack === 'local' ? 'local Liforma stack' : 'production Liforma APIs';
	console.log(`Serving ${root} → http://${host}:${port}/ (${label})`);
});
