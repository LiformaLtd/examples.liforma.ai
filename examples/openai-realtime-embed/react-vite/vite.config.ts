import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createOpenAiApiMiddleware } from './server/api-handlers.mjs';

export default defineConfig({
	plugins: [
		react(),
		{
			name: 'openai-demo-api',
			configureServer(server) {
				server.middlewares.use(createOpenAiApiMiddleware());
			},
			configurePreviewServer(server) {
				server.middlewares.use(createOpenAiApiMiddleware());
			}
		}
	],
	server: {
		port: 4007,
		strictPort: true
	},
	preview: {
		port: 4007,
		strictPort: true
	}
});
