import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import {
	attachGeminiLiveProxy,
	createGeminiProxyReadyMiddleware
} from '../shared/gemini-live-proxy.mjs';

function geminiLiveProxyPlugin(): Plugin {
	const attach = (httpServer: import('node:http').Server | null) => {
		if (!httpServer) return;
		attachGeminiLiveProxy(httpServer);
	};

	return {
		name: 'gemini-live-proxy',
		configureServer(server) {
			server.middlewares.use(createGeminiProxyReadyMiddleware());
			// After Vite installs its own middlewares / httpServer is ready.
			return () => {
				attach(server.httpServer);
			};
		},
		configurePreviewServer(server) {
			server.middlewares.use(createGeminiProxyReadyMiddleware());
			return () => {
				attach(server.httpServer);
			};
		}
	};
}

export default defineConfig({
	plugins: [react(), geminiLiveProxyPlugin()],
	server: {
		port: 4010,
		strictPort: true
	},
	preview: {
		port: 4010,
		strictPort: true
	}
});
