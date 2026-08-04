#!/usr/bin/env node
/**
 * Monorepo-only: run Vite (SvelteKit / React) with window.__LIFORMA_STACK injected.
 * Not part of the copy-paste example apps — keeps third-party sample code production-only.
 *
 * Usage (cwd = example package): node <examples-repo>/scripts/dev-with-local-stack.mjs
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const require = createRequire(join(cwd, 'package.json'));
const vite = await import(pathToFileURL(require.resolve('vite')).href);
const { createServer, loadConfigFromFile, mergeConfig } = vite;

const INJECT = '<script>window.__LIFORMA_STACK="local";</script>';

function injectHtml(html) {
	if (html.includes('__LIFORMA_STACK')) return html;
	return html.includes('</head>')
		? html.replace('</head>', `${INJECT}</head>`)
		: `${INJECT}${html}`;
}

const injectPlugin = {
	name: 'liforma-inject-local-stack',
	transformIndexHtml(html) {
		return injectHtml(html);
	},
	configureServer(server) {
		server.middlewares.use((_req, res, next) => {
			const originalEnd = res.end.bind(res);
			res.end = function end(chunk, encoding, cb) {
				const type = res.getHeader('content-type');
				if (typeof type === 'string' && type.includes('text/html') && chunk != null) {
					const asString = Buffer.isBuffer(chunk)
						? chunk.toString('utf8')
						: typeof chunk === 'string'
							? chunk
							: null;
					if (asString?.includes('</head>')) {
						const injected = injectHtml(asString);
						if (injected !== asString) {
							chunk = Buffer.from(injected, 'utf8');
							res.setHeader('content-length', chunk.length);
						}
					}
				}
				return originalEnd(chunk, encoding, cb);
			};
			next();
		});
	}
};

const loaded = await loadConfigFromFile(
	{ command: 'serve', mode: 'development' },
	join(cwd, 'vite.config.ts')
);

const config = mergeConfig(loaded?.config ?? {}, {
	configFile: false,
	plugins: [injectPlugin]
});

const server = await createServer(config);
await server.listen();
server.printUrls();
console.log('(local Liforma stack: window.__LIFORMA_STACK=local)');
