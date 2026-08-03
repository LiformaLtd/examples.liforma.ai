const LOCAL_PLAYER_EMBED_URL = 'http://localhost:3002/embed';

export function useLocalStack(): boolean {
	if (process.env.NEXT_PUBLIC_LIFORMA_STACK === 'local') return true;
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	if (params.get('stack') === 'local') return true;
	return (window as Window & { __LIFORMA_STACK?: string }).__LIFORMA_STACK === 'local';
}

export function playerEmbedUrl(): string | undefined {
	return useLocalStack() ? LOCAL_PLAYER_EMBED_URL : undefined;
}
