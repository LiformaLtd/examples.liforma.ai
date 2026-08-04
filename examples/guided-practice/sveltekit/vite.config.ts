import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 4004,
		strictPort: true
	},
	preview: {
		port: 4004,
		strictPort: true
	}
});
