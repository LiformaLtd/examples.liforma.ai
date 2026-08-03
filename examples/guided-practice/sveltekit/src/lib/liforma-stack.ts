const LOCAL_PLAYER_EMBED_URL = 'http://localhost:3002/embed';

/** True when this example should target the local Liforma stack. */
export function useLocalStack(): boolean {
	const viteStack = import.meta.env.VITE_LIFORMA_STACK;
	if (viteStack === 'local') return true;
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	if (params.get('stack') === 'local') return true;
	return window.__LIFORMA_STACK === 'local';
}

/** Player embed origin override for local development. */
export function playerEmbedUrl(): string | undefined {
	return useLocalStack() ? LOCAL_PLAYER_EMBED_URL : undefined;
}
