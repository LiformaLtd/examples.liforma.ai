/**
 * Demo-only helper: mint an ephemeral OpenAI Realtime client secret via the local API route.
 * Production: call your own backend; never expose OPENAI_API_KEY to browsers.
 */

export class DemoClientSecretError extends Error {
	readonly name = 'DemoClientSecretError';
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
	}
}

export async function fetchDemoClientSecret(apiKey: string): Promise<string> {
	const res = await fetch('/api/openai-realtime-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey: apiKey.trim() || undefined })
	});

	const text = await res.text();
	let data: { value?: string; ephemeralKey?: string; error?: string; detail?: string } = {};
	try {
		data = JSON.parse(text) as typeof data;
	} catch {
		/* ignore */
	}

	if (!res.ok) {
		throw new DemoClientSecretError(
			data.error || data.detail || text.slice(0, 200) || `HTTP ${res.status}`,
			res.status
		);
	}

	const value = String(data.value ?? data.ephemeralKey ?? '').trim();
	if (!value) {
		throw new DemoClientSecretError('OpenAI response missing ephemeral client secret value');
	}
	return value;
}
