#!/usr/bin/env node
/**
 * Custom Next.js server so Gemini Live WebSocket upgrades work locally.
 * App Router route handlers cannot perform WS upgrades — this wraps Next + the shared proxy.
 *
 * Usage: node server.mjs   (see package.json "dev")
 */
import { createServer } from 'node:http';
import { parse } from 'node:url';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import next from 'next';
import {
	attachGeminiLiveProxy,
	handleGeminiProxyReady
} from '../shared/gemini-live-proxy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4010);
const hostname = process.env.HOST || '127.0.0.1';
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer(async (req, res) => {
	try {
		if (await handleGeminiProxyReady(req, res)) return;
		const parsedUrl = parse(req.url ?? '/', true);
		await handle(req, res, parsedUrl);
	} catch (err) {
		console.error(err);
		res.statusCode = 500;
		res.end('Internal Server Error');
	}
});

attachGeminiLiveProxy(server);

server.listen(port, hostname, () => {
	console.log(`Gemini Live embed (Next.js) → http://${hostname}:${port}/`);
	console.log(`WS proxy: /api/gemini-live  |  ready: POST /api/gemini-proxy-ready`);
});
