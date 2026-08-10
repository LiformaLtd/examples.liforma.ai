/**
 * Demo-only helper: mint an ephemeral OpenAI Realtime client secret via the local API route.
 * Production: call your own backend; never expose OPENAI_API_KEY to browsers.
 */

export class DemoClientSecretError extends Error {
	/**
	 * @param {string} message
	 * @param {number} [status]
	 */
	constructor(message, status) {
		super(message);
		this.name = 'DemoClientSecretError';
		this.status = status;
	}
}

/**
 * @param {string} apiKey
 * @returns {Promise<string>}
 */
export async function fetchDemoClientSecret(apiKey) {
	const res = await fetch('/api/openai-realtime-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey: apiKey.trim() || undefined })
	});

	const text = await res.text();
	/** @type {{ value?: string; ephemeralKey?: string; error?: string; detail?: string }} */
	let data = {};
	try {
		data = JSON.parse(text);
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
