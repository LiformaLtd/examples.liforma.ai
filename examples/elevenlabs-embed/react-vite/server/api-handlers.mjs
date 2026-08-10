/**
 * Dev-server API handlers for the ElevenLabs signed-URL demo proxy.
 * Wired from vite.config.ts configureServer — secrets stay server-side.
 */

function normalizeApiKey(raw) {
	return String(raw ?? '')
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

async function readJsonBody(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	const text = Buffer.concat(chunks).toString('utf8');
	return text ? JSON.parse(text) : {};
}

function sendJson(res, status, body) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(body));
}

export async function handleElevenlabsSignedUrl(req, res) {
	let agentId = '';
	let apiKey = '';
	try {
		const body = await readJsonBody(req);
		agentId = String(body.agentId ?? '').trim();
		apiKey = normalizeApiKey(body.apiKey);
	} catch {
		sendJson(res, 400, { error: 'Invalid JSON body' });
		return;
	}

	if (!apiKey) {
		apiKey = normalizeApiKey(process.env.ELEVENLABS_API_KEY);
	}

	if (!agentId) {
		sendJson(res, 400, { error: 'agentId is required' });
		return;
	}
	if (!apiKey) {
		sendJson(res, 400, {
			error:
				'apiKey is required (paste in the form, or set ELEVENLABS_API_KEY when starting the server)'
		});
		return;
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
			const parsed = JSON.parse(text);
			elevenCode = String(parsed?.detail?.status ?? parsed?.detail?.code ?? '');
			elevenMessage = String(parsed?.detail?.message ?? '');
		} catch {
			/* ignore */
		}
		sendJson(res, upstream.status, {
			error: 'ElevenLabs signed URL request failed',
			detail: text.slice(0, 500),
			elevenCode,
			elevenMessage,
			keyMeta
		});
		return;
	}

	let signedUrl = '';
	try {
		const data = JSON.parse(text);
		signedUrl = String(data.signed_url ?? data.signedUrl ?? '').trim();
	} catch {
		sendJson(res, 502, { error: 'Unexpected ElevenLabs response' });
		return;
	}

	if (!signedUrl) {
		sendJson(res, 502, { error: 'ElevenLabs response missing signed_url' });
		return;
	}

	sendJson(res, 200, { signedUrl });
}

/** Vite dev/preview middleware for POST /api/elevenlabs-signed-url */
export function createElevenlabsApiMiddleware() {
	return (req, res, next) => {
		const path = req.url?.split('?')[0] ?? '';
		if (path !== '/api/elevenlabs-signed-url' || req.method !== 'POST') {
			next();
			return;
		}
		void handleElevenlabsSignedUrl(req, res).catch((err) => {
			console.error(err);
			sendJson(res, 500, { error: 'Internal server error' });
		});
	};
}
