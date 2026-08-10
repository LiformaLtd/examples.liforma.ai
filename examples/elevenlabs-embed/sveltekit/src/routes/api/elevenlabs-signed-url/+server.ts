/**
 * Demo-only signed-URL proxy for ElevenLabs Agents.
 * Production: mint on your backend; never expose API keys to browsers.
 */
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function normalizeApiKey(raw: string): string {
	return raw
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

export const POST: RequestHandler = async ({ request }) => {
	let agentId = '';
	let apiKey = '';
	try {
		const body = (await request.json()) as { agentId?: string; apiKey?: string };
		agentId = String(body.agentId ?? '').trim();
		apiKey = normalizeApiKey(String(body.apiKey ?? ''));
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!apiKey) {
		apiKey = normalizeApiKey(String(env.ELEVENLABS_API_KEY ?? ''));
	}

	if (!agentId) {
		return json({ error: 'agentId is required' }, { status: 400 });
	}
	if (!apiKey) {
		return json(
			{
				error:
					'apiKey is required (paste in the form, or set ELEVENLABS_API_KEY when starting the server)'
			},
			{ status: 400 }
		);
	}

	const keyMeta = {
		length: apiKey.length,
		prefix: apiKey.slice(0, 3),
		suffix: apiKey.slice(-4),
		startsWithSk: apiKey.startsWith('sk_')
	};

	const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
	url.searchParams.set('agent_id', agentId);

	const upstream = await fetch(url, {
		headers: { 'xi-api-key': apiKey }
	});

	const text = await upstream.text();
	if (!upstream.ok) {
		let elevenCode = '';
		let elevenMessage = '';
		try {
			const parsed = JSON.parse(text) as {
				detail?: { status?: string; code?: string; message?: string };
			};
			elevenCode = String(parsed?.detail?.status ?? parsed?.detail?.code ?? '');
			elevenMessage = String(parsed?.detail?.message ?? '');
		} catch {
			/* ignore */
		}
		return json(
			{
				error: 'ElevenLabs signed URL request failed',
				detail: text.slice(0, 500),
				elevenCode,
				elevenMessage,
				keyMeta
			},
			{ status: upstream.status }
		);
	}

	let signedUrl = '';
	try {
		const data = JSON.parse(text) as { signed_url?: string; signedUrl?: string };
		signedUrl = String(data.signed_url ?? data.signedUrl ?? '').trim();
	} catch {
		return json({ error: 'Unexpected ElevenLabs response' }, { status: 502 });
	}

	if (!signedUrl) {
		return json({ error: 'ElevenLabs response missing signed_url' }, { status: 502 });
	}

	return json({ signedUrl });
};
