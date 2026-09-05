const DEFAULT_PLAYER_ORIGINS = [
	'https://player.liforma.ai',
	'http://localhost:3002'
] as const;

export function isPlayerFullWindowMessage(
	event: MessageEvent,
	playerOrigins: readonly string[] = DEFAULT_PLAYER_ORIGINS
): event is MessageEvent<{
	readonly type: 'fullWindow';
	readonly payload: { readonly active: boolean };
}> {
	if (!playerOrigins.includes(event.origin)) return false;
	const data = event.data;
	if (!data || typeof data !== 'object') return false;
	const msg = data as { type?: unknown; payload?: unknown };
	if (msg.type !== 'fullWindow') return false;
	const payload = msg.payload;
	if (!payload || typeof payload !== 'object') return false;
	return typeof (payload as { active?: unknown }).active === 'boolean';
}
