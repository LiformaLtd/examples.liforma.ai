/**
 * Demo-only helper: mint a LiveKit participant token via the local API route.
 * Production: call your own backend; never expose LIVEKIT_API_SECRET to browsers.
 */

export class DemoLiveKitTokenError extends Error {
	readonly name = 'DemoLiveKitTokenError';
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
	}
}

export type DemoLiveKitToken = {
	url: string;
	token: string;
	roomName: string;
	identity: string;
};

export async function fetchDemoLiveKitToken(opts?: {
	roomName?: string;
	identity?: string;
}): Promise<DemoLiveKitToken> {
	const res = await fetch('/api/livekit-token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			roomName: opts?.roomName?.trim() || undefined,
			identity: opts?.identity?.trim() || undefined
		})
	});

	const text = await res.text();
	let data: {
		url?: string;
		token?: string;
		roomName?: string;
		identity?: string;
		error?: string;
	} = {};
	try {
		data = JSON.parse(text) as typeof data;
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
		roomName: String(data.roomName ?? opts?.roomName ?? ''),
		identity: String(data.identity ?? opts?.identity ?? '')
	};
}
