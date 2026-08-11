import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 4009,
		strictPort: true
	},
	preview: {
		port: 4009,
		strictPort: true
	}
});
