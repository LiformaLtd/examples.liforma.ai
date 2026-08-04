import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) =>
			filename.includes('@liforma/client') || filename.includes('cdn.liforma.ai')
				? true
				: filename.split(/[/\\]/).includes('node_modules')
					? undefined
					: true
	},
	kit: {
		adapter: adapter({ runtime: 'nodejs22.x' })
	},
	vite: {
		optimizeDeps: {
			include: ['@liforma/client']
		},
		ssr: {
			noExternal: ['@liforma/client']
		}
	}
};

export default config;
