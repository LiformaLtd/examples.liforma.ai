/**
 * Demo page shell for the ElevenLabs embed example.
 *
 * Integration pattern (copy this into your product):
 *   → helloByo.js → startByoSpeech (wraps bridge.js / connectElevenLabsAgent)
 *
 * This file only wires demo UI: Connect/End, credential form, agent prompt
 * copy fields, and Connect-before-Start arming.
 */

import {
	EXPERIENCE_ID,
	SUGGESTED_FIRST_MESSAGE,
	SUGGESTED_SYSTEM_PROMPT
} from './config.js';
import { loadAgentId, saveAgentId } from './agentIdStore.js';
import { fetchDemoSignedUrl } from './demoSignedUrl.js';
import { startByoSpeech } from './helloByo.js';

const experienceHostEl = document.getElementById('experience-host');
const statusPillEl = document.getElementById('status-pill');
const logListEl = document.getElementById('log-list');
const formEl = document.getElementById('elevenlabs-form');
const agentIdEl = document.getElementById('agent-id');
const apiKeyEl = document.getElementById('api-key');
const apiKeyHintEl = document.getElementById('api-key-hint');
const toggleKeyBtnEl = document.getElementById('btn-toggle-key');
const connectBtnEl = document.getElementById('btn-connect');
const endBtnEl = document.getElementById('btn-end');
const connectFirstDialogEl = document.getElementById('connect-first-dialog');
const experienceIdLabelEl = document.getElementById('experience-id-label');
const suggestedFirstEl = document.getElementById('suggested-first-message');
const suggestedPromptEl = document.getElementById('suggested-system-prompt');
const copyFirstBtnEl = document.getElementById('btn-copy-first');
const copyPromptBtnEl = document.getElementById('btn-copy-prompt');

/** Typical ElevenLabs key shape — length varies; only warn on obvious paste mistakes. */
const ELEVENLABS_API_KEY_MIN_LENGTH = 20;
const ELEVENLABS_API_KEYS_URL = 'https://elevenlabs.io/app/settings/api-keys';

/** @type {import('@liforma/client').Experience | null} */
let experience = null;
let sessionReady = false;

/**
 * Connect arms credentials (and may pre-mint a signed URL). The ElevenLabs socket
 * opens only after the player has started — preferred order: Connect → Start.
 */
let armed = false;
/** @type {string | null} */
let cachedSignedUrl = null;
let connecting = false;

/** @type {Awaited<ReturnType<typeof startByoSpeech>> | null} */
let bridge = null;

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
	key = key.replace(/^Bearer\s+/i, '');
	key = key.replace(/^["']|["']$/g, '');
	key = key.replace(/[\u200B-\u200D\uFEFF]/g, '');
	return key.trim();
}

function hasCredentials() {
	return Boolean(agentIdEl?.value.trim());
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

function clearArm() {
	armed = false;
	cachedSignedUrl = null;
}

function showConnectFirstModal() {
	if (!(connectFirstDialogEl instanceof HTMLDialogElement)) return;
	if (connectFirstDialogEl.open) return;
	connectFirstDialogEl.showModal();
}

function isBridgeLive() {
	return Boolean(bridge?.isConnected());
}

function refreshControls() {
	const connected = isBridgeLive();
	if (connectBtnEl) {
		connectBtnEl.disabled = connecting || connected || armed || !hasCredentials();
		if (connecting) connectBtnEl.textContent = 'Connecting…';
		else if (armed && !connected) connectBtnEl.textContent = 'Waiting for Start';
		else connectBtnEl.textContent = 'Connect';
	}
	if (endBtnEl) endBtnEl.disabled = !(connected || armed || connecting);
	if (agentIdEl) agentIdEl.disabled = connected || armed || connecting;
	if (apiKeyEl) apiKeyEl.disabled = connected || armed || connecting;
	updateStatusFromState();
}

function updateStatusFromState() {
	if (isBridgeLive()) {
		setStatus('Talking via ElevenLabs → avatar', 'active');
		return;
	}
	if (connecting) {
		setStatus('Connecting to ElevenLabs…', 'active');
		return;
	}
	if (!experience) {
		setStatus('Loading experience…', 'active');
		return;
	}
	if (armed && !sessionReady) {
		setStatus('Connected — tap Start experience on the avatar', 'active');
		return;
	}
	if (armed && sessionReady) {
		setStatus('Opening ElevenLabs…', 'active');
		return;
	}
	if (!hasCredentials()) {
		setStatus('Enter Agent ID (and API key if private), then Connect', 'default');
		return;
	}
	if (!sessionReady) {
		setStatus('Connect ElevenLabs, then tap Start on the avatar', 'default');
		return;
	}
	setStatus('Ready — Connect to wire ElevenLabs', 'active');
}

/** @param {unknown} err */
function handleConnectError(err) {
	const code =
		err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
			? err.code
			: err instanceof Error
				? err.message
				: '';
	const keyMeta = err && typeof err === 'object' && 'keyMeta' in err ? err.keyMeta : null;

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
		return;
	}
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn');
	console.warn('[elevenlabs-embed]', message);
}

/**
 * Connect click: validate (+ optional signed-URL mint), arm, then open the bridge
 * immediately if the player is already started.
 */
async function armElevenLabs() {
	if (isBridgeLive() || connecting || armed) return;

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

	connecting = true;
	refreshControls();

	try {
		cachedSignedUrl = null;
		if (apiKey) {
			log('Requesting signed URL via local proxy…');
			cachedSignedUrl = await fetchDemoSignedUrl(agentId, apiKey);
			log('Signed URL ready. ElevenLabs will open after you start the player.');
		} else {
			log('No API key — will connect as public agent with agentId only.');
		}

		armed = true;
		connecting = false;
		refreshControls();

		if (sessionReady) {
			await openBridge();
		} else {
			log('Armed. Tap Start experience on the avatar to unlock audio and begin.');
		}
	} catch (err) {
		connecting = false;
		clearArm();
		handleConnectError(err);
		refreshControls();
	}
}

/** Open the integration bridge (see bridge.js). Requires player started + armed. */
async function openBridge() {
	if (isBridgeLive() || connecting) return;
	if (!armed) return;
	if (!experience || !sessionReady) return;

	const agentId = agentIdEl?.value.trim() ?? '';
	const apiKey = normalizeApiKey(apiKeyEl?.value ?? '');
	if (!agentId) {
		clearArm();
		log('Enter your ElevenLabs Agent ID.', 'warn');
		refreshControls();
		return;
	}

	connecting = true;
	refreshControls();

	try {
		let signedUrl = cachedSignedUrl;
		if (!signedUrl && apiKey) {
			log('Requesting signed URL via local proxy…');
			signedUrl = await fetchDemoSignedUrl(agentId, apiKey);
			cachedSignedUrl = signedUrl;
		}

		bridge = await startByoSpeech(experience, {
			agentId: signedUrl ? undefined : agentId,
			signedUrl: signedUrl ?? undefined,
			onLog: (line, kind) => log(line, kind),
			onDisconnect: () => {
				bridge = null;
				clearArm();
				refreshControls();
			}
		});

		connecting = false;
		refreshControls();
	} catch (err) {
		bridge = null;
		connecting = false;
		clearArm();
		handleConnectError(err);
		refreshControls();
	}
}

async function endElevenLabs() {
	const active = bridge;
	bridge = null;
	connecting = false;
	const wasArmed = armed;
	clearArm();
	refreshControls();

	if (active) {
		try {
			await active.end();
		} catch (err) {
			console.error(err);
		}
		log('Conversation ended');
	} else if (wasArmed) {
		log('Disconnected (cleared armed ElevenLabs connection).');
	}

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
		onStart: () => {
			sessionReady = true;
			log('Player unlocked.');
			refreshControls();
			if (armed && !isBridgeLive()) {
				void openBridge();
				return;
			}
			if (!armed) {
				showConnectFirstModal();
				log('Start before Connect — connect to ElevenLabs below to begin the conversation.');
			}
		}
	});

	if (!experienceHostEl) throw new Error('Experience host element missing.');

	let readyHandled = false;
	const handleReady = () => {
		if (readyHandled) return;
		readyHandled = true;
		if (experienceIdLabelEl) experienceIdLabelEl.textContent = EXPERIENCE_ID;
		refreshControls();
		log('Experience ready. Connect ElevenLabs, then tap Start experience on the avatar.');
	};

	experience.on('ready', handleReady);

	await experience.attach({
		container: experienceHostEl,
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
		},
		onPlayerStatusChange: (state) => {
			if (state === 'error') {
				setStatus('Experience error', 'warn');
				if (connectBtnEl) connectBtnEl.disabled = true;
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
	if (armed && !isBridgeLive()) {
		clearArm();
		log('Credentials changed — click Connect again.', 'warn');
	}
	scheduleSaveAgentId();
	refreshControls();
});
agentIdEl?.addEventListener('change', () => {
	void saveAgentId(agentIdEl.value);
});
apiKeyEl?.addEventListener('input', () => {
	if (armed && !isBridgeLive()) {
		clearArm();
		log('Credentials changed — click Connect again.', 'warn');
	}
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
	void armElevenLabs();
});
endBtnEl?.addEventListener('click', () => {
	void endElevenLabs();
});

log(
	'Developer tip: copy helloByo.js (startByoSpeech) into your product. Flow: Connect → Start experience.'
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
	if (connectBtnEl) connectBtnEl.disabled = true;
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn');
});
