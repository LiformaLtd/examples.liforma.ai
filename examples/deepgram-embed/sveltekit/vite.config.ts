import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import {
	attachDeepgramAgentProxy,
	createDeepgramProxyReadyMiddleware
} from '../shared/deepgram-agent-proxy.mjs';

function deepgramAgentProxyPlugin(): Plugin {
	const attach = (httpServer: import('node:http').Server | null) => {
		if (!httpServer) return;
		attachDeepgramAgentProxy(httpServer);
	};

	return {
		name: 'deepgram-agent-proxy',
		configureServer(server) {
			server.middlewares.use(createDeepgramProxyReadyMiddleware());
			// After Vite installs its own middlewares / httpServer is ready.
			return () => {
				attach(server.httpServer);
			};
		},
		configurePreviewServer(server) {
			server.middlewares.use(createDeepgramProxyReadyMiddleware());
			return () => {
				attach(server.httpServer);
			};
		}
	};
}

export default defineConfig({
	plugins: [sveltekit(), deepgramAgentProxyPlugin()],
	server: {
		port: 4008,
		strictPort: true
	},
	preview: {
		port: 4008,
		strictPort: true
	}
});
