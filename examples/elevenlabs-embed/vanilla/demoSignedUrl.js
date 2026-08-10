/**
 * Demo-only: mint an ElevenLabs Agents signed URL via the local example server.
 *
 * Production apps should mint signed URLs on your own backend and never put the
 * ElevenLabs API key in the browser. See server.mjs in this folder.
 */

function formatUpstreamError(status, data) {
	const detailRaw = typeof data.detail === 'string' ? data.detail : '';
	const message =
		(typeof data.elevenMessage === 'string' && data.elevenMessage) ||
		(() => {
			try {
				const parsed = JSON.parse(detailRaw);
				return (
					parsed?.detail?.message ||
					parsed?.message ||
					(typeof parsed?.detail === 'string' ? parsed.detail : '')
				);
			} catch {
				return detailRaw;
			}
		})();

	if (status === 404) {
		return (
			'ElevenLabs could not find that agent (404). Check the Agent ID. ' +
			(message ? `(${message})` : '')
		).trim();
	}
	return data.error
		? `${data.error}${message ? `: ${message}` : detailRaw ? `: ${detailRaw}` : ''}`
		: `HTTP ${status}${message ? `: ${message}` : ''}`;
}

function classifyElevenLabsAuthError(status, data) {
	const code = String(data.elevenCode ?? '').toLowerCase();
	const detailRaw = typeof data.detail === 'string' ? data.detail.toLowerCase() : '';
	const message = String(data.elevenMessage ?? '').toLowerCase();
	const isInvalidKey =
		code === 'invalid_api_key' ||
		detailRaw.includes('"status":"invalid_api_key"') ||
		message.includes('invalid api key');
	if (status === 401 && isInvalidKey) return 'elevenlabs_invalid_api_key';
	if (status === 401) return 'elevenlabs_invalid_api_key';

	const isPermission =
		status === 403 ||
		code === 'missing_permissions' ||
		code === 'insufficient_permissions' ||
		code === 'forbidden' ||
		message.includes('permission') ||
		detailRaw.includes('insufficient_permissions') ||
		detailRaw.includes('missing_permissions');
	if (isPermission) return 'elevenlabs_agents_permission';
	return null;
}

/**
 * @param {string} agentId
 * @param {string} apiKey
 * @returns {Promise<string>}
 */
export async function fetchDemoSignedUrl(agentId, apiKey) {
	const res = await fetch('/api/elevenlabs-signed-url', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ agentId, apiKey })
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const kind = classifyElevenLabsAuthError(res.status, data);
		if (kind) {
			const err = new Error(kind);
			err.code = kind;
			err.keyMeta = data.keyMeta ?? null;
			err.httpStatus = res.status;
			err.elevenCode = data.elevenCode ?? '';
			err.elevenMessage = data.elevenMessage ?? '';
			console.warn('[elevenlabs-embed] signed-url failed', {
				kind,
				httpStatus: res.status,
				elevenCode: data.elevenCode,
				elevenMessage: data.elevenMessage,
				keyMeta: data.keyMeta
			});
			throw err;
		}
		throw new Error(formatUpstreamError(res.status, data));
	}
	if (!data.signedUrl) throw new Error('Signed URL missing from proxy response');
	return data.signedUrl;
}
