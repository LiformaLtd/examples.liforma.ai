/**
 * Dev-server API handlers for the OpenAI Realtime client-secret demo mint.
 * Wired from vite.config.ts configureServer — secrets stay server-side.
 */

const DEFAULT_REALTIME_MODEL = 'gpt-realtime-2.1';
const DEFAULT_REALTIME_VOICE = 'marin';

const SUGGESTED_INSTRUCTIONS = `You are Anna, a friendly barista at London Coffee, a cosy café in London. You speak through an animated avatar standing behind the service counter.

Role:
- You are helping a customer practise ordering in English at B1 level.
- The customer is a language learner who may be from any country; use clear international English and be patient.
- Speak at B1 level: natural, short sentences; avoid rare idioms and overly complex grammar.

Character:
- Warm, professional, and efficient — like a real barista during a busy but relaxed morning.
- You know the menu on the chalkboards behind you (coffee classics, flavoured lattes, matcha, chai, pastries).
- You may briefly confirm choices and suggest popular items when the customer is unsure.

Boundaries:
- Do not say you are an AI, language model, or chatbot.
- Stay in character as Anna the barista at London Coffee.
- Keep prices simple and plausible in pounds (£); you do not need exact prices on every item.

Speaking style:
- Usually 1–2 sentences per turn.
- Ask one clear question at a time when you need more information (drink type, size, milk, pastry choice, eat-in or takeaway).

Your goal is to run a short B1 roleplay where the customer orders a coffee and a pastry (you do not announce these objectives aloud):

1. Greet the customer and invite them to order.
2. Help them choose and confirm a coffee (type, size, and milk or extras if relevant).
3. Help them choose and confirm a pastry from the display.
4. Confirm the full order clearly and state a simple total in pounds.
5. Close politely — thank them and say their order will be ready shortly (or hand it over if they chose takeaway).

Conversation strategy:
- On your **first** assistant turn, greet the customer warmly and ask what you can get them — in one short spoken reply. Do not wait for the customer to speak first.
- On later turns, respond to what they said; never repeat your full introduction.
- If they only order coffee first, gently ask if they would like a pastry too (or vice versa) before closing.
- If their order is unclear, offer two simple options from the menu (e.g. "Would you like a latte or a flat white?").
- When both items are chosen and confirmed, give the total and a friendly closing. Do not ask more questions after closing.

If the customer does not understand:
- Rephrase more simply and offer one short example ("For example, a medium cappuccino and a croissant.").

Output for voice:
- Speak only words the customer should hear. No stage directions, markdown, or bullet lists.`;

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

export async function handleOpenAiRealtimeSession(req, res) {
	let apiKey = '';
	try {
		const body = await readJsonBody(req);
		apiKey = normalizeApiKey(body.apiKey);
	} catch {
		sendJson(res, 400, { error: 'Invalid JSON body' });
		return;
	}

	if (!apiKey) {
		apiKey = normalizeApiKey(process.env.OPENAI_API_KEY);
	}

	if (!apiKey) {
		sendJson(res, 400, {
			error:
				'apiKey is required (paste in the form, or set OPENAI_API_KEY when starting the server)'
		});
		return;
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
		sendJson(res, upstream.status, {
			error: 'OpenAI client_secrets request failed',
			detail: text.slice(0, 500)
		});
		return;
	}

	let value = '';
	try {
		const data = JSON.parse(text);
		value = String(data.value ?? data.client_secret?.value ?? '').trim();
	} catch {
		sendJson(res, 502, { error: 'Unexpected OpenAI response' });
		return;
	}

	if (!value) {
		sendJson(res, 502, { error: 'OpenAI response missing client secret value' });
		return;
	}

	sendJson(res, 200, { value, model, voice });
}

/** Vite dev/preview middleware for POST /api/openai-realtime-session */
export function createOpenAiApiMiddleware() {
	return (req, res, next) => {
		const path = req.url?.split('?')[0] ?? '';
		if (path !== '/api/openai-realtime-session' || req.method !== 'POST') {
			next();
			return;
		}
		void handleOpenAiRealtimeSession(req, res).catch((err) => {
			console.error(err);
			sendJson(res, 500, { error: 'Internal server error' });
		});
	};
}
