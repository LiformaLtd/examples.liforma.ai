import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createLiveKitApiMiddleware } from './server/api-handlers.mjs';

export default defineConfig({
	plugins: [
		react(),
		{
			name: 'livekit-demo-api',
			configureServer(server) {
				server.middlewares.use(createLiveKitApiMiddleware());
			},
			configurePreviewServer(server) {
				server.middlewares.use(createLiveKitApiMiddleware());
			}
		}
	],
	server: {
		port: 4009,
		strictPort: true
	},
	preview: {
		port: 4009,
		strictPort: true
	}
});
