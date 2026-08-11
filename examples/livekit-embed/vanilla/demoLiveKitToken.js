/**
 * Demo-only: mint a LiveKit participant token via the local API route.
 */

export class DemoLiveKitTokenError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'DemoLiveKitTokenError';
		this.status = status;
	}
}

export async function fetchDemoLiveKitToken(opts = {}) {
	const res = await fetch('/api/livekit-token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			roomName: opts.roomName?.trim() || undefined,
			identity: opts.identity?.trim() || undefined
		})
	});

	const text = await res.text();
	let data = {};
	try {
		data = JSON.parse(text);
	} catch {
		/* ignore */
	}

	if (!res.ok) {
		throw new DemoLiveKitTokenError(
			data.error || text.slice(0, 200) || `HTTP ${res.status}`,
			res.status
		);
	}

	const url = String(data.url ?? '').trim();
	const token = String(data.token ?? '').trim();
	if (!url || !token) {
		throw new DemoLiveKitTokenError('LiveKit mint response missing url or token');
	}

	return {
		url,
		token,
		roomName: String(data.roomName ?? opts.roomName ?? ''),
		identity: String(data.identity ?? opts.identity ?? '')
	};
}
