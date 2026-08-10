/**
 * Demo-only: mint an ElevenLabs Agents signed URL via this app's API route.
 *
 * Production apps should mint signed URLs on your own backend and never put the
 * ElevenLabs API key in the browser.
 */

export type SignedUrlErrorCode = 'elevenlabs_invalid_api_key' | 'elevenlabs_agents_permission';

export class DemoSignedUrlError extends Error {
	readonly code: SignedUrlErrorCode | string;
	readonly keyMeta: {
		length?: number;
		prefix?: string;
		suffix?: string;
		startsWithSk?: boolean;
	} | null;

	constructor(
		code: string,
		keyMeta: DemoSignedUrlError['keyMeta'] = null
	) {
		super(code);
		this.name = 'DemoSignedUrlError';
		this.code = code;
		this.keyMeta = keyMeta;
	}
}

function formatUpstreamError(status: number, data: Record<string, unknown>): string {
	const detailRaw = typeof data.detail === 'string' ? data.detail : '';
	const message =
		(typeof data.elevenMessage === 'string' && data.elevenMessage) ||
		(() => {
			try {
				const parsed = JSON.parse(detailRaw) as {
					detail?: { message?: string } | string;
					message?: string;
				};
				return (
					(typeof parsed?.detail === 'object' && parsed.detail?.message) ||
					parsed?.message ||
					(typeof parsed?.detail === 'string' ? parsed.detail : '') ||
					''
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
	const error = typeof data.error === 'string' ? data.error : '';
	return error
		? `${error}${message ? `: ${message}` : detailRaw ? `: ${detailRaw}` : ''}`
		: `HTTP ${status}${message ? `: ${message}` : ''}`;
}

function classifyElevenLabsAuthError(
	status: number,
	data: Record<string, unknown>
): SignedUrlErrorCode | null {
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

export async function fetchDemoSignedUrl(agentId: string, apiKey: string): Promise<string> {
	const res = await fetch('/api/elevenlabs-signed-url', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ agentId, apiKey })
	});
	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok) {
		const kind = classifyElevenLabsAuthError(res.status, data);
		if (kind) {
			throw new DemoSignedUrlError(
				kind,
				(data.keyMeta as DemoSignedUrlError['keyMeta']) ?? null
			);
		}
		throw new Error(formatUpstreamError(res.status, data));
	}
	const signedUrl = typeof data.signedUrl === 'string' ? data.signedUrl : '';
	if (!signedUrl) throw new Error('Signed URL missing from proxy response');
	return signedUrl;
}
