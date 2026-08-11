#!/usr/bin/env node
/**
 * Custom Next.js server so Deepgram Voice Agent WebSocket upgrades work locally.
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
	attachDeepgramAgentProxy,
	handleDeepgramProxyReady
} from '../shared/deepgram-agent-proxy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4008);
const hostname = process.env.HOST || '127.0.0.1';
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer(async (req, res) => {
	try {
		if (await handleDeepgramProxyReady(req, res)) return;
		const parsedUrl = parse(req.url ?? '/', true);
		await handle(req, res, parsedUrl);
	} catch (err) {
		console.error(err);
		res.statusCode = 500;
		res.end('Internal Server Error');
	}
});

attachDeepgramAgentProxy(server);

server.listen(port, hostname, () => {
	console.log(`Deepgram Voice Agent embed (Next.js) → http://${hostname}:${port}/`);
	console.log(`WS proxy: /api/deepgram-agent  |  ready: POST /api/deepgram-proxy-ready`);
});
