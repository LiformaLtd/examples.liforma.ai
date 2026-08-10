import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createElevenlabsApiMiddleware } from './server/api-handlers.mjs';

export default defineConfig({
	plugins: [
		react(),
		{
			name: 'elevenlabs-demo-api',
			configureServer(server) {
				server.middlewares.use(createElevenlabsApiMiddleware());
			},
			configurePreviewServer(server) {
				server.middlewares.use(createElevenlabsApiMiddleware());
			}
		}
	],
	server: {
		port: 4006,
		strictPort: true
	},
	preview: {
		port: 4006,
		strictPort: true
	}
});
