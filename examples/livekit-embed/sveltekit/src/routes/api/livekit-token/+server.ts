/**
 * Demo-only LiveKit participant-token mint.
 * Production: mint on your backend; never expose LIVEKIT_API_SECRET to browsers.
 *
 * Env: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 */
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { AccessToken } from 'livekit-server-sdk';
import type { RequestHandler } from './$types';
import { DEFAULT_IDENTITY, DEFAULT_ROOM_NAME } from '$lib/config';

function normalize(raw: string): string {
	return raw
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

export const POST: RequestHandler = async ({ request }) => {
	let roomName = DEFAULT_ROOM_NAME;
	let identity = DEFAULT_IDENTITY;
	try {
		const body = (await request.json()) as { roomName?: string; identity?: string };
		const r = normalize(String(body.roomName ?? ''));
		const i = normalize(String(body.identity ?? ''));
		if (r) roomName = r;
		if (i) identity = i;
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const url = normalize(String(env.LIVEKIT_URL ?? ''));
	const apiKey = normalize(String(env.LIVEKIT_API_KEY ?? ''));
	const apiSecret = normalize(String(env.LIVEKIT_API_SECRET ?? ''));

	if (!url || !apiKey || !apiSecret) {
		return json(
			{
				error:
					'Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET when starting the server (see README)'
			},
			{ status: 400 }
		);
	}

	try {
		const at = new AccessToken(apiKey, apiSecret, {
			identity,
			ttl: 60 * 60
		});
		at.addGrant({
			roomJoin: true,
			room: roomName,
			canSubscribe: true,
			canPublish: false,
			canPublishData: false
		});
		const token = await at.toJwt();
		return json({ url, token, roomName, identity });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return json({ error: message }, { status: 500 });
	}
};
