/**
 * Demo page shell for the Gemini Live embed example.
 * Integration: copy `helloByo.js` into your product (npm apps: helloByo.ts).
 *
 * This file only wires demo UI: Connect/End, credential form, and Connect-before-Start arming.
 */

import { EXPERIENCE_ID } from './config.js';
import {
	DemoProxyReadyError,
	buildGeminiProxyUrl,
	fetchDemoProxyReady
} from './demoProxyReady.js';
import { startByoSpeech } from './helloByo.js';

const experienceHostEl = document.getElementById('experience-host');
const statusPillEl = document.getElementById('status-pill');
const logListEl = document.getElementById('log-list');
const formEl = document.getElementById('gemini-form');
const apiKeyEl = document.getElementById('api-key');
const apiKeyHintEl = document.getElementById('api-key-hint');
const toggleKeyBtnEl = document.getElementById('btn-toggle-key');
const connectBtnEl = document.getElementById('btn-connect');
const endBtnEl = document.getElementById('btn-end');
const connectFirstDialogEl = document.getElementById('connect-first-dialog');
const experienceIdLabelEl = document.getElementById('experience-id-label');

const GEMINI_API_KEY_MIN_LENGTH = 20;
const GEMINI_AI_STUDIO_URL = 'https://aistudio.google.com/apikey';

/** @type {import('@liforma/client').Experience | null} */
let experience = null;
let sessionReady = false;
let armed = false;
/** @type {string | null} */
let cachedProxyUrl = null;
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

function normalizeApiKey(raw) {
	return String(raw ?? '')
		.replace(/^Token\s+/i, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

function clearArm() {
	armed = false;
	cachedProxyUrl = null;
}

function bridgeLive() {
	return Boolean(bridge?.isConnected());
}

function updateApiKeyHint() {
	if (!apiKeyHintEl) return;
	const key = normalizeApiKey(apiKeyEl?.value ?? '');
	if (!key) {
		apiKeyHintEl.hidden = true;
		apiKeyHintEl.textContent = '';
		return;
	}
	if (key.length < GEMINI_API_KEY_MIN_LENGTH) {
		apiKeyHintEl.hidden = false;
		apiKeyHintEl.textContent = `Key looks too short (${key.length} chars). Paste the full secret from the Gemini console.`;
		return;
	}
	apiKeyHintEl.hidden = true;
	apiKeyHintEl.textContent = '';
}

function refreshControls() {
	const live = bridgeLive();
	if (connectBtnEl) {
		connectBtnEl.disabled = connecting || live || armed;
		connectBtnEl.textContent = connecting
			? 'Connecting…'
			: armed && !live
				? 'Waiting for Start'
				: 'Connect';
	}
	if (endBtnEl) endBtnEl.disabled = !(live || armed || connecting);
	if (apiKeyEl) apiKeyEl.disabled = live || armed || connecting;
}

function refreshStatus() {
	if (bridgeLive()) {
		setStatus('Talking via Gemini Live → avatar', 'active');
	} else if (connecting) {
		setStatus('Connecting to Gemini…', 'active');
	} else if (!experience) {
		setStatus('Loading experience…', 'active');
	} else if (armed && !sessionReady) {
		setStatus('Connected — tap Start experience on the avatar', 'active');
	} else if (armed && sessionReady) {
		setStatus('Opening Gemini Live…', 'active');
	} else if (!sessionReady) {
		setStatus('Connect Gemini, then tap Start on the avatar', 'default');
	} else {
		setStatus('Ready — Connect to wire Gemini Live', 'active');
	}
	refreshControls();
}

function handleConnectError(err) {
	setStatus('Gemini connect failed', 'warn');
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn', { href: GEMINI_AI_STUDIO_URL, label: 'Open Google AI Studio' });
	if (err instanceof DemoProxyReadyError && err.status === 400) {
		log('Provide a Gemini API key in the form, or set GEMINI_API_KEY on the server.', 'warn');
	}
}

async function openBridge() {
	if (bridgeLive() || connecting || !armed || !experience || !sessionReady) return;
	connecting = true;
	refreshStatus();
	try {
		let proxyUrl = cachedProxyUrl;
		if (!proxyUrl) {
			const key = normalizeApiKey(apiKeyEl?.value ?? '');
			const ready = await fetchDemoProxyReady(key);
			proxyUrl = buildGeminiProxyUrl({
				apiKey: key,
				useEnvKey: ready.useEnvKey,
				proxyPath: ready.proxyPath
			});
			cachedProxyUrl = proxyUrl;
		}
		bridge = await startByoSpeech(experience, {
			proxyUrl,
			onLog: (line, kind) => log(line, kind),
			onDisconnect: () => {
				bridge = null;
				clearArm();
				refreshStatus();
			},
			onError: (message) => log(message, 'warn')
		});
	} catch (err) {
		bridge = null;
		clearArm();
		handleConnectError(err);
	} finally {
		connecting = false;
		refreshStatus();
	}
}

async function armGemini() {
	if (bridgeLive() || connecting || armed) return;
	const key = normalizeApiKey(apiKeyEl?.value ?? '');
	if (key && key.length < GEMINI_API_KEY_MIN_LENGTH) {
		updateApiKeyHint();
		log(`API key looks too short (${key.length} chars).`, 'warn');
		return;
	}
	connecting = true;
	refreshStatus();
	try {
		cachedProxyUrl = null;
		log('Validating Gemini API key via local proxy…');
		const ready = await fetchDemoProxyReady(key);
		cachedProxyUrl = buildGeminiProxyUrl({
			apiKey: key,
			useEnvKey: ready.useEnvKey,
			proxyPath: ready.proxyPath
		});
		log(
			ready.useEnvKey
				? 'Using GEMINI_API_KEY from server env. Gemini will open after you start the player.'
				: 'Proxy ready. Gemini will open after you start the player.'
		);
		armed = true;
		connecting = false;
		refreshStatus();
		if (sessionReady) {
			await openBridge();
		} else {
			log('Armed. Tap Start experience on the avatar to unlock audio and begin.');
		}
	} catch (err) {
		connecting = false;
		clearArm();
		handleConnectError(err);
		refreshStatus();
	}
}

async function endGemini() {
	const active = bridge;
	bridge = null;
	connecting = false;
	const wasArmed = armed;
	clearArm();
	refreshStatus();
	if (active) {
		try {
			await active.end();
		} catch (err) {
			console.error(err);
		}
		log('Conversation ended');
	} else if (wasArmed) {
		log('Disconnected (cleared armed Gemini connection).');
	}
	refreshStatus();
}

function showConnectFirstModal() {
	if (!connectFirstDialogEl || connectFirstDialogEl.open) return;
	connectFirstDialogEl.showModal();
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
		},
		onStart: () => {
			sessionReady = true;
			log('Player unlocked.');
			refreshStatus();
			if (armed && !bridgeLive()) {
				void openBridge();
				return;
			}
			if (!armed) {
				showConnectFirstModal();
				log('Start before Connect — connect to Gemini below to begin the conversation.');
			}
		}
	});

	if (!experienceHostEl) throw new Error('Experience host element missing.');

	let readyHandled = false;
	const handleReady = () => {
		if (readyHandled) return;
		readyHandled = true;
		if (experienceIdLabelEl) experienceIdLabelEl.textContent = EXPERIENCE_ID;
		refreshStatus();
		log('Experience ready. Connect Gemini, then tap Start experience on the avatar.');
	};

	experience.on('ready', handleReady);

	await experience.attach({
		container: experienceHostEl,
		onStateUpdate: (state) => {
			if (state === 'error') {
				setStatus('Experience error', 'warn');
				if (connectBtnEl) connectBtnEl.disabled = true;
			}
		}
	});

	if (!readyHandled) handleReady();
	refreshStatus();
}

apiKeyEl?.addEventListener('input', () => {
	if (armed && !bridgeLive()) {
		clearArm();
		log('Credentials changed — click Connect again.', 'warn');
	}
	updateApiKeyHint();
	refreshStatus();
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
	void armGemini();
});
endBtnEl?.addEventListener('click', () => {
	void endGemini();
});

log(
	'Developer tip: copy helloByo.js (startByoSpeech). Flow: Connect → Start experience.'
);

refreshStatus();

void initExperience().catch((err) => {
	console.error(err);
	setStatus('Failed to load', 'warn');
	if (connectBtnEl) connectBtnEl.disabled = true;
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn');
});
