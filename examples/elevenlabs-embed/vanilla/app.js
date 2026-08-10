import {
	EXPERIENCE_ID,
	SUGGESTED_FIRST_MESSAGE,
	SUGGESTED_SYSTEM_PROMPT
} from './config.js';
import { loadAgentId, saveAgentId } from './agentIdStore.js';

const experienceHostEl = document.getElementById('experience-host');
const statusPillEl = document.getElementById('status-pill');
const logListEl = document.getElementById('log-list');
const formEl = document.getElementById('elevenlabs-form');
const agentIdEl = document.getElementById('agent-id');
const apiKeyEl = document.getElementById('api-key');
const apiKeyHintEl = document.getElementById('api-key-hint');
const toggleKeyBtnEl = document.getElementById('btn-toggle-key');
const startBtnEl = document.getElementById('btn-start');
const endBtnEl = document.getElementById('btn-end');

/** Typical ElevenLabs key shape — length varies; only warn on obvious paste mistakes. */
const ELEVENLABS_API_KEY_MIN_LENGTH = 20;
const ELEVENLABS_API_KEYS_URL = 'https://elevenlabs.io/app/settings/api-keys';
const experienceIdLabelEl = document.getElementById('experience-id-label');
const suggestedFirstEl = document.getElementById('suggested-first-message');
const suggestedPromptEl = document.getElementById('suggested-system-prompt');
const copyFirstBtnEl = document.getElementById('btn-copy-first');
const copyPromptBtnEl = document.getElementById('btn-copy-prompt');

/** @type {import('@liforma/client').Experience | null} */
let experience = null;
let sessionReady = false;

/** @type {import('@elevenlabs/client').Conversation | null} */
let conversation = null;

/**
 * @typedef {{ utterance: ReturnType<NonNullable<typeof experience>['speech']['createUtterance']>; writes: Promise<void> }} Turn
 */
/** @type {Turn | null} */
let turn = null;
/** null until agent_output_audio_format arrives (or fallback timer). */
/** @type {number | null} */
let sampleRate = null;
let sampleRateReady = false;
/** @type {string[]} */
let pendingAudioB64 = [];
let sampleRateFallbackTimer = 0;

function setStatus(text, tone = 'default') {
	if (!statusPillEl) return;
	statusPillEl.textContent = text;
	statusPillEl.dataset.tone = tone;
}

/**
 * @param {string} line
 * @param {'info' | 'warn'} [kind]
 * @param {{ href: string; label: string } | null} [link]
 */
function log(line, kind = 'info', link = null) {
	if (!logListEl) return;
	const li = document.createElement('li');
	if (kind !== 'info') li.dataset.kind = kind;

	if (link) {
		const before = document.createTextNode(`${line} `);
		const a = document.createElement('a');
		a.href = link.href;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		a.textContent = link.label;
		li.append(before, a);
	} else {
		li.textContent = line;
	}

	logListEl.appendChild(li);
	logListEl.scrollTop = logListEl.scrollHeight;
}

/**
 * @param {string} message
 * @param {string} linkLabel
 */
function showKeyHintWithLink(message, linkLabel) {
	if (apiKeyHintEl) {
		apiKeyHintEl.hidden = false;
		apiKeyHintEl.replaceChildren();
		apiKeyHintEl.append(document.createTextNode(`${message} `));
		const a = document.createElement('a');
		a.href = ELEVENLABS_API_KEYS_URL;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		a.textContent = linkLabel;
		apiKeyHintEl.append(a);
	}
	log(message, 'warn', {
		href: ELEVENLABS_API_KEYS_URL,
		label: linkLabel
	});
}

function showElevenAgentsPermissionHint() {
	showKeyHintWithLink(
		'ElevenLabs denied this key for Agents (permission error). Signed-URL minting needs "Eleven Agents" → Write (Read alone is not enough). Save changes, then try again.',
		'Click here to edit the key, toggle "Eleven Agents" to "Write" and click "Save changes".'
	);
}

/**
 * @param {{ length?: number; prefix?: string; suffix?: string; startsWithSk?: boolean } | null} keyMeta
 */
function showInvalidApiKeyHint(keyMeta) {
	const suffix = keyMeta?.suffix ? `••••${keyMeta.suffix}` : '••••????';
	const length = typeof keyMeta?.length === 'number' ? String(keyMeta.length) : '?';
	showKeyHintWithLink(
		`ElevenLabs rejected the API key value itself (invalid_api_key). The proxy received a ${length}-character key ending ${suffix} — that last-4 must match the dashboard. Re-create the key, copy the full sk_… once, paste it here, and ensure Eleven Agents is enabled.`,
		'Click here to create/edit an API key.'
	);
}

function normalizeApiKey(raw) {
	let key = String(raw ?? '').trim();
	// Strip accidental "Bearer " / quotes / zero-width chars from paste.
	key = key.replace(/^Bearer\s+/i, '');
	key = key.replace(/^["']|["']$/g, '');
	key = key.replace(/[\u200B-\u200D\uFEFF]/g, '');
	return key.trim();
}

function hasCredentials() {
	const agentId = agentIdEl?.value.trim() ?? '';
	// Agent ID alone is enough for public agents; key required for private.
	return Boolean(agentId);
}

function updateApiKeyHint() {
	if (!apiKeyHintEl || !apiKeyEl) return;
	const key = normalizeApiKey(apiKeyEl.value);
	if (!key) {
		apiKeyHintEl.hidden = true;
		apiKeyHintEl.textContent = '';
		return;
	}
	if (key.length < ELEVENLABS_API_KEY_MIN_LENGTH) {
		apiKeyHintEl.hidden = false;
		apiKeyHintEl.textContent = `Key looks too short (${key.length} chars). Re-copy the full secret from Create Key (dashboard only shows •••• + last 4 later).`;
		return;
	}
	if (!key.startsWith('sk_')) {
		apiKeyHintEl.hidden = false;
		apiKeyHintEl.textContent =
			'ElevenLabs API keys usually start with sk_. Make sure you pasted the API key, not the Agent ID.';
		return;
	}
	apiKeyHintEl.hidden = true;
	apiKeyHintEl.textContent = '';
}

/** Enable Start when credentials are present; player unlock is checked on click. */
function refreshControls() {
	const connected = Boolean(conversation);
	if (startBtnEl) startBtnEl.disabled = connected || !hasCredentials();
	if (endBtnEl) endBtnEl.disabled = !connected;
	if (agentIdEl) agentIdEl.disabled = connected;
	if (apiKeyEl) apiKeyEl.disabled = connected;
	updateStatusFromState();
}

function updateStatusFromState() {
	if (conversation) {
		setStatus('Talking via ElevenLabs → avatar', 'active');
		return;
	}
	if (!experience) {
		setStatus('Loading experience…', 'active');
		return;
	}
	if (!sessionReady) {
		setStatus('Tap “Start experience” in the player first', 'warn');
		return;
	}
	if (!hasCredentials()) {
		setStatus('Enter Agent ID (and API key if private)', 'default');
		return;
	}
	setStatus('Ready — start ElevenLabs conversation', 'active');
}

/** @returns {Uint8Array} */
function base64ToPcmBytes(b64) {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

/** Liforma speech.write rejects chunks larger than 64 KiB. */
const MAX_PCM_CHUNK_BYTES = 64 * 1024;

/**
 * @param {{ write: (chunk: ArrayBuffer | ArrayBufferView) => Promise<unknown> }} utterance
 * @param {Uint8Array} bytes
 */
async function writePcmInChunks(utterance, bytes) {
	// Fast path — typical ElevenLabs frames are well under the cap.
	if (bytes.byteLength <= MAX_PCM_CHUNK_BYTES) {
		if ((bytes.byteLength & 1) !== 0) {
			await utterance.write(bytes.subarray(0, bytes.byteLength - 1));
			return;
		}
		await utterance.write(bytes);
		return;
	}
	let offset = 0;
	while (offset < bytes.byteLength) {
		let end = Math.min(offset + MAX_PCM_CHUNK_BYTES, bytes.byteLength);
		if (end < bytes.byteLength && (end - offset) % 2 === 1) end -= 1;
		if (end <= offset) break;
		await utterance.write(bytes.subarray(offset, end));
		offset = end;
	}
}

function clearSampleRateFallback() {
	if (!sampleRateFallbackTimer) return;
	window.clearTimeout(sampleRateFallbackTimer);
	sampleRateFallbackTimer = 0;
}

function flushPendingAudio() {
	if (!pendingAudioB64.length) return;
	const queued = pendingAudioB64;
	pendingAudioB64 = [];
	for (const b64 of queued) writeAgentAudio(b64);
}

/**
 * Wrong sample-rate locks make STA/energy clocks drift — mouth can look stuck open.
 * Wait for metadata (short fallback) before createUtterance.
 * @param {number} rate
 */
function lockSampleRate(rate) {
	if (sampleRateReady) return;
	if (!Number.isFinite(rate) || rate <= 0) return;
	sampleRate = rate;
	sampleRateReady = true;
	clearSampleRateFallback();
	log(`Agent output format: pcm_${sampleRate}`);
	flushPendingAudio();
}

function armSampleRateFallback() {
	clearSampleRateFallback();
	sampleRateFallbackTimer = window.setTimeout(() => {
		sampleRateFallbackTimer = 0;
		if (!sampleRateReady) {
			log('No agent_output_audio_format yet — falling back to pcm_16000', 'warn');
			lockSampleRate(16_000);
		}
	}, 800);
}

/** @param {string} base64Audio */
function writeAgentAudio(base64Audio) {
	if (!experience || !sampleRateReady || sampleRate == null) return;
	if (!turn) {
		const utterance = experience.speech.createUtterance({
			format: { encoding: 'pcm_s16le', sampleRate, channels: 1 },
			queue: 'replace-active'
		});
		turn = { utterance, writes: Promise.resolve() };
	}
	const current = turn;
	const bytes = base64ToPcmBytes(base64Audio);
	current.writes = current.writes
		.then(() => writePcmInChunks(current.utterance, bytes))
		.catch((err) => console.error(err));
}

/** @param {string} base64Audio */
function handleAgentAudio(base64Audio) {
	if (!sampleRateReady) {
		pendingAudioB64.push(base64Audio);
		return;
	}
	writeAgentAudio(base64Audio);
}

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
	// Prefer invalid-key over permission when ElevenLabs says the secret is wrong.
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
 * @returns {Promise<string>}
 */
async function fetchSignedUrl(agentId, apiKey) {
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

function getConversationCtor() {
	const Conversation = window.ElevenLabsClient?.Conversation;
	if (!Conversation) {
		throw new Error(
			'ElevenLabs client not loaded. Ensure the @elevenlabs/client script is included.'
		);
	}
	return Conversation;
}

async function startElevenLabs() {
	if (conversation) return;

	const agentId = agentIdEl?.value.trim() ?? '';
	const apiKey = normalizeApiKey(apiKeyEl?.value ?? '');
	if (!agentId) {
		log('Enter your ElevenLabs Agent ID.', 'warn');
		refreshControls();
		return;
	}
	void saveAgentId(agentId);
	if (apiKey && apiKey.length < ELEVENLABS_API_KEY_MIN_LENGTH) {
		updateApiKeyHint();
		log(`API key looks too short (${apiKey.length} chars).`, 'warn');
		return;
	}
	if (!experience || !sessionReady) {
		setStatus('Tap “Start experience” in the player first', 'warn');
		log(
			'Unlock the Liforma player first: click “Start experience” on the avatar, then Start conversation again.',
			'warn'
		);
		return;
	}

	setStatus('Connecting to ElevenLabs…', 'active');
	if (startBtnEl) startBtnEl.disabled = true;

	try {
		const Conversation = getConversationCtor();
		/** @type {Record<string, unknown>} */
		const sessionOpts = {
			connectionType: 'websocket',

			onConversationMetadata: (meta) => {
				const fmt = meta?.agent_output_audio_format;
				const m = /^pcm_(\d+)$/.exec(fmt ?? '');
				if (m) lockSampleRate(Number(m[1]));
			},

			onAudio: (base64Audio) => {
				handleAgentAudio(base64Audio);
			},

			onModeChange: ({ mode }) => {
				if (mode !== 'listening') return;
				const current = turn;
				turn = null;
				if (!current) return;
				void current.writes.then(() => current.utterance.close({ history: 'none' }));
			},

			onInterruption: () => {
				pendingAudioB64 = [];
				const current = turn;
				turn = null;
				void (current
					? current.utterance.cancel()
					: experience?.speech.interrupt({ scope: 'active' }));
			},

			onError: (message) => {
				log(`ElevenLabs error: ${message}`, 'warn');
			},

			onDisconnect: () => {
				clearSampleRateFallback();
				pendingAudioB64 = [];
				log('ElevenLabs disconnected');
				conversation = null;
				turn = null;
				sampleRate = null;
				sampleRateReady = false;
				refreshControls();
			}
		};

		if (apiKey) {
			log('Requesting signed URL via local proxy…');
			sessionOpts.signedUrl = await fetchSignedUrl(agentId, apiKey);
		} else {
			log('No API key — connecting as public agent with agentId only…');
			sessionOpts.agentId = agentId;
		}

		sampleRate = null;
		sampleRateReady = false;
		pendingAudioB64 = [];
		turn = null;
		armSampleRateFallback();

		conversation = await Conversation.startSession(sessionOpts);

		// Critical: silence ElevenLabs playback — Liforma owns the speaker.
		await conversation.setVolume({ volume: 0 });

		refreshControls();
		log('Conversation started. Speak into your mic — the avatar should lip-sync.');
	} catch (err) {
		conversation = null;
		const code =
			err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
				? err.code
				: err instanceof Error
					? err.message
					: '';
		const keyMeta =
			err && typeof err === 'object' && 'keyMeta' in err ? err.keyMeta : null;

		refreshControls();
		setStatus('ElevenLabs connect failed', 'warn');

		if (code === 'elevenlabs_agents_permission') {
			showElevenAgentsPermissionHint();
			console.warn(
				'[elevenlabs-embed] API key permission error — set Eleven Agents → Write (not only Read), then Save.'
			);
			return;
		}
		if (code === 'elevenlabs_invalid_api_key') {
			showInvalidApiKeyHint(keyMeta);
			const suffix = keyMeta?.suffix ? `••••${keyMeta.suffix}` : '';
			const length = keyMeta?.length;
			const fingerprint =
				suffix || length
					? `Key fingerprint from proxy: length=${length ?? '?'}, ends with ${suffix || '????'} (compare with dashboard last-4).`
					: 'ElevenLabs returned invalid_api_key for the value in the form.';
			log(fingerprint, 'warn');
			console.warn('[elevenlabs-embed]', fingerprint);
			console.warn(
				'[elevenlabs-embed] The red POST 401 in DevTools is expected — check the yellow hint under API key / session log.'
			);
			return;
		}
		const message = err instanceof Error ? err.message : String(err);
		log(message, 'warn');
		console.warn('[elevenlabs-embed]', message);
	}
}

async function endElevenLabs() {
	clearSampleRateFallback();
	pendingAudioB64 = [];
	const current = turn;
	turn = null;
	const active = conversation;
	conversation = null;
	sampleRate = null;
	sampleRateReady = false;
	refreshControls();

	if (current) {
		try {
			await current.writes;
			await current.utterance.close({ history: 'none' });
		} catch {
			/* ignore */
		}
	}

	if (active) {
		try {
			await active.endSession();
		} catch (err) {
			console.error(err);
		}
	}

	log('Conversation ended');
	refreshControls();
}

async function initExperience() {
	setStatus('Loading experience…', 'active');

	const Experience = window.Liforma?.Experience;
	if (!Experience) {
		throw new Error(
			'Liforma SDK not loaded. Ensure https://cdn.liforma.ai/sdk/v2/client.js is included.'
		);
	}

	experience = await Experience.startSession({
		experienceId: EXPERIENCE_ID,
		mode: 'presenter',
		speechInputMode: 'off',
		startButton: {
			label: 'Start experience',
			ariaLabel: 'Start experience session and unlock audio',
			placement: 'bottom-center',
			variant: 'primary',
			appearance: {
				backgroundColor: '#0d7a5f',
				textColor: '#ffffff',
				borderRadiusPx: 999,
				size: 'large',
				shadow: 'soft'
			}
		}
	});

	if (!experienceHostEl) throw new Error('Experience host element missing.');

	let readyHandled = false;
	const handleReady = () => {
		if (readyHandled) return;
		readyHandled = true;
		if (experienceIdLabelEl) experienceIdLabelEl.textContent = EXPERIENCE_ID;
		setStatus('Tap Start experience in the player', 'default');
		log('Experience ready. Unlock audio with the player start button, then start ElevenLabs.');
	};

	experience.on('ready', handleReady);
	experience.on('started', () => {
		sessionReady = true;
		log('Player unlocked. You can start the ElevenLabs conversation.');
		refreshControls();
	});

	await experience.attach({
		container: experienceHostEl,
		onStateUpdate: (state) => {
			if (state === 'error') {
				setStatus('Experience error', 'warn');
				if (startBtnEl) startBtnEl.disabled = true;
			}
		}
	});

	if (!readyHandled) handleReady();
	refreshControls();
}

async function copyText(text, button) {
	try {
		await navigator.clipboard.writeText(text);
		if (!button) return;
		const prev = button.textContent;
		button.textContent = 'Copied';
		window.setTimeout(() => {
			button.textContent = prev;
		}, 1400);
		log('Copied to clipboard');
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		log(`Copy failed: ${message}`, 'warn');
	}
}

if (suggestedFirstEl) suggestedFirstEl.value = SUGGESTED_FIRST_MESSAGE;
if (suggestedPromptEl) suggestedPromptEl.value = SUGGESTED_SYSTEM_PROMPT;

copyFirstBtnEl?.addEventListener('click', () => {
	void copyText(SUGGESTED_FIRST_MESSAGE, copyFirstBtnEl);
});
copyPromptBtnEl?.addEventListener('click', () => {
	void copyText(SUGGESTED_SYSTEM_PROMPT, copyPromptBtnEl);
});

let agentIdSaveTimer = 0;

function scheduleSaveAgentId() {
	window.clearTimeout(agentIdSaveTimer);
	agentIdSaveTimer = window.setTimeout(() => {
		void saveAgentId(agentIdEl?.value ?? '');
	}, 250);
}

agentIdEl?.addEventListener('input', () => {
	scheduleSaveAgentId();
	refreshControls();
});
agentIdEl?.addEventListener('change', () => {
	void saveAgentId(agentIdEl.value);
});
apiKeyEl?.addEventListener('input', () => {
	updateApiKeyHint();
	refreshControls();
});

toggleKeyBtnEl?.addEventListener('click', () => {
	if (!apiKeyEl || !toggleKeyBtnEl) return;
	const hide = apiKeyEl.type !== 'password';
	apiKeyEl.type = hide ? 'password' : 'text';
	toggleKeyBtnEl.textContent = hide ? 'Show' : 'Hide';
	toggleKeyBtnEl.setAttribute('aria-pressed', hide ? 'false' : 'true');
});

formEl?.addEventListener('submit', (event) => {
	event.preventDefault();
	void startElevenLabs();
});
endBtnEl?.addEventListener('click', () => {
	void endElevenLabs();
});

log(
	'Flow: (1) copy prompt into ElevenLabs agent (2) tap Start experience on the avatar (3) Start conversation.'
);

async function restoreAgentId() {
	const saved = await loadAgentId();
	if (!saved || !agentIdEl) return;
	agentIdEl.value = saved;
	log('Restored Agent ID from this browser (API key is never stored).');
	refreshControls();
}

void restoreAgentId();
refreshControls();

void initExperience().catch((err) => {
	console.error(err);
	setStatus('Failed to load', 'warn');
	if (startBtnEl) startBtnEl.disabled = true;
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn');
});
