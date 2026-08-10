/**
 * Demo-only ephemeral client-secret mint for OpenAI Realtime.
 * Production: mint on your backend; never expose API keys to browsers.
 */
import {
	DEFAULT_REALTIME_MODEL,
	DEFAULT_REALTIME_VOICE,
	SUGGESTED_INSTRUCTIONS
} from '@/lib/config';
import { NextResponse } from 'next/server';

function normalizeApiKey(raw: string): string {
	return raw
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

export async function POST(request: Request) {
	let apiKey = '';
	try {
		const body = (await request.json()) as { apiKey?: string };
		apiKey = normalizeApiKey(String(body.apiKey ?? ''));
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!apiKey) {
		apiKey = normalizeApiKey(String(process.env.OPENAI_API_KEY ?? ''));
	}

	if (!apiKey) {
		return NextResponse.json(
			{
				error:
					'apiKey is required (paste in the form, or set OPENAI_API_KEY when starting the server)'
			},
			{ status: 400 }
		);
	}

	const model = String(process.env.OPENAI_REALTIME_MODEL ?? DEFAULT_REALTIME_MODEL).trim();
	const voice = String(process.env.OPENAI_REALTIME_VOICE ?? DEFAULT_REALTIME_VOICE).trim();

	const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'OpenAI-Safety-Identifier': 'liforma-examples-openai-realtime-embed'
		},
		body: JSON.stringify({
			session: {
				type: 'realtime',
				model,
				instructions: SUGGESTED_INSTRUCTIONS,
				audio: {
					output: {
						voice
					}
				}
			}
		})
	});

	const text = await upstream.text();
	if (!upstream.ok) {
		return NextResponse.json(
			{
				error: 'OpenAI client_secrets request failed',
				detail: text.slice(0, 500)
			},
			{ status: upstream.status }
		);
	}

	let value = '';
	try {
		const data = JSON.parse(text) as {
			value?: string;
			client_secret?: { value?: string };
		};
		value = String(data.value ?? data.client_secret?.value ?? '').trim();
	} catch {
		return NextResponse.json({ error: 'Unexpected OpenAI response' }, { status: 502 });
	}

	if (!value) {
		return NextResponse.json({ error: 'OpenAI response missing client secret value' }, { status: 502 });
	}

	return NextResponse.json({ value, model, voice });
}
