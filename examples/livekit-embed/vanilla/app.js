/**
 * Demo page shell for the LiveKit embed example.
 *
 * Integration (copy into your product):
 *   → helloByo.js → startByoSpeech (wraps bridge.js / connectLiveKitAgent)
 */

import { DEFAULT_IDENTITY, DEFAULT_ROOM_NAME, EXPERIENCE_ID } from './config.js';
import { DemoLiveKitTokenError, fetchDemoLiveKitToken } from './demoLiveKitToken.js';
import { startByoSpeech } from './helloByo.js';

const experienceHostEl = document.getElementById('experience-host');
const statusPillEl = document.getElementById('status-pill');
const logListEl = document.getElementById('log-list');
const formEl = document.getElementById('livekit-form');
const roomNameEl = document.getElementById('room-name');
const identityEl = document.getElementById('identity');
const connectBtnEl = document.getElementById('btn-connect');
const endBtnEl = document.getElementById('btn-end');
const connectFirstDialogEl = document.getElementById('connect-first-dialog');
const experienceIdLabelEl = document.getElementById('experience-id-label');

const LIVEKIT_CLOUD_URL = 'https://cloud.livekit.io/';

/** @type {import('@liforma/client').Experience | null} */
let experience = null;
let sessionReady = false;
let armed = false;
/** @type {{ url: string; token: string; roomName: string; identity: string } | null} */
let cachedCreds = null;
let connecting = false;
/** @type {Awaited<ReturnType<typeof startByoSpeech>> | null} */
let bridge = null;

if (roomNameEl) roomNameEl.value = DEFAULT_ROOM_NAME;
if (identityEl) identityEl.value = DEFAULT_IDENTITY;

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

function clearArm() {
	armed = false;
	cachedCreds = null;
}

function bridgeLive() {
	return Boolean(bridge?.isConnected());
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
	const disabled = live || armed || connecting;
	if (roomNameEl) roomNameEl.disabled = disabled;
	if (identityEl) identityEl.disabled = disabled;
}

function refreshStatus() {
	if (bridgeLive()) {
		setStatus('Talking via LiveKit → avatar', 'active');
	} else if (connecting) {
		setStatus('Connecting to LiveKit…', 'active');
	} else if (!experience) {
		setStatus('Loading experience…', 'active');
	} else if (armed && !sessionReady) {
		setStatus('Connected — tap Start experience on the avatar', 'active');
	} else if (armed && sessionReady) {
		setStatus('Joining LiveKit room…', 'active');
	} else if (!sessionReady) {
		setStatus('Connect LiveKit, then tap Start on the avatar', 'default');
	} else {
		setStatus('Ready — Connect to wire LiveKit voice', 'active');
	}
	refreshControls();
}

function handleConnectError(err) {
	setStatus('LiveKit connect failed', 'warn');
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn', { href: LIVEKIT_CLOUD_URL, label: 'Open LiveKit Cloud' });
	if (err instanceof DemoLiveKitTokenError && err.status === 400) {
		log('Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.', 'warn');
	}
}

async function openBridge() {
	if (bridgeLive() || connecting || !armed || !experience || !sessionReady) return;
	connecting = true;
	refreshStatus();
	try {
		let creds = cachedCreds;
		if (!creds) {
			log('Minting LiveKit participant token via local API…');
			creds = await fetchDemoLiveKitToken({
				roomName: roomNameEl?.value ?? DEFAULT_ROOM_NAME,
				identity: identityEl?.value ?? DEFAULT_IDENTITY
			});
			cachedCreds = creds;
		}
		bridge = await startByoSpeech(experience, {
			url: creds.url,
			token: creds.token,
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

async function armLiveKit() {
	if (bridgeLive() || connecting || armed) return;
	connecting = true;
	refreshStatus();
	try {
		cachedCreds = null;
		log('Minting LiveKit participant token via local API…');
		cachedCreds = await fetchDemoLiveKitToken({
			roomName: roomNameEl?.value ?? DEFAULT_ROOM_NAME,
			identity: identityEl?.value ?? DEFAULT_IDENTITY
		});
		log(
			`Token ready for room "${cachedCreds.roomName}" as "${cachedCreds.identity}". LiveKit will join after you start the player.`
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

async function endLiveKit() {
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
		log('Disconnected (cleared armed LiveKit connection).');
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
				log('Start before Connect — connect to LiveKit below to begin the conversation.');
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
		log('Experience ready. Connect LiveKit, then tap Start experience on the avatar.');
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
	refreshStatus();
}

function onFieldChange() {
	if (armed && !bridgeLive()) {
		clearArm();
		log('Room settings changed — click Connect again.', 'warn');
	}
	refreshStatus();
}

roomNameEl?.addEventListener('input', onFieldChange);
identityEl?.addEventListener('input', onFieldChange);

formEl?.addEventListener('submit', (event) => {
	event.preventDefault();
	void armLiveKit();
});
endBtnEl?.addEventListener('click', () => {
	void endLiveKit();
});

log(
	'Developer tip: copy helloByo.js (startByoSpeech) into your product. Flow: Connect → Start experience. An agent identity starting with "agent" must publish audio.'
);

refreshStatus();

void initExperience().catch((err) => {
	console.error(err);
	setStatus('Failed to load', 'warn');
	if (connectBtnEl) connectBtnEl.disabled = true;
	const message = err instanceof Error ? err.message : String(err);
	log(message, 'warn');
});
