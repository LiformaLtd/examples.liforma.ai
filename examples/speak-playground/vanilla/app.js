import { DEMO_LINES, SPEAK_EXPERIENCE_ID } from './config.js';

const experienceHostEl = document.getElementById('experience-host');
const statusPillEl = document.getElementById('status-pill');
const logListEl = document.getElementById('log-list');
const speakFormEl = document.getElementById('speak-form');
const speakInputEl = document.getElementById('speak-input');
const speakBtnEl = document.getElementById('btn-speak');
const burstBtnEl = document.getElementById('btn-burst');
const experienceIdLabelEl = document.getElementById('experience-id-label');
const behaviorEnqueueEl = document.getElementById('behavior-enqueue');
const behaviorInterruptEl = document.getElementById('behavior-interrupt');
const labelEnqueueEl = document.getElementById('label-enqueue');
const labelInterruptEl = document.getElementById('label-interrupt');

/** @type {import('@liforma/client').Experience | null} */
let experience = null;
let sessionReady = false;

function setStatus(text, tone = 'default') {
	if (!statusPillEl) return;
	statusPillEl.textContent = text;
	statusPillEl.dataset.tone = tone;
}

function log(line, kind = 'info') {
	if (!logListEl) return;
	const li = document.createElement('li');
	li.textContent = line;
	if (kind !== 'info') li.dataset.kind = kind;
	logListEl.appendChild(li);
	logListEl.scrollTop = logListEl.scrollHeight;
}

function selectedQueue() {
	return behaviorInterruptEl?.checked ? 'replace-active' : 'append';
}

function updateBehaviorLabels() {
	const interrupt = behaviorInterruptEl?.checked ?? false;
	labelEnqueueEl?.classList.toggle('is-selected', !interrupt);
	labelInterruptEl?.classList.toggle('is-selected', interrupt);
}

function setInputEnabled(enabled) {
	if (speakInputEl) speakInputEl.disabled = !enabled;
	if (speakBtnEl) speakBtnEl.disabled = !enabled;
	if (burstBtnEl) burstBtnEl.disabled = !enabled;
}

function queueSpeak(text) {
	if (!experience || !text.trim()) return;

	const queue = selectedQueue();
	log(`speech.speak({ queue: '${queue}' }): “${text.trim()}”`, 'speak');

	void experience.speech
		.speak({ text: text.trim(), queue })
		.then((result) => {
			log(`completed (${result.durationMs}ms): “${result.transcript ?? text.trim()}”`, 'end');
		})
		.catch((err) => {
			if (err instanceof DOMException && err.name === 'AbortError') {
				log(`interrupted: “${text.trim()}”`, 'interrupt');
				return;
			}
			const message = err instanceof Error ? err.message : String(err);
			log(`error: ${message}`, 'interrupt');
		});
}

function handleSubmit(text) {
	const trimmed = text.trim();
	if (!trimmed || !sessionReady) return;
	queueSpeak(trimmed);
	if (speakInputEl) speakInputEl.value = '';
}

async function initExperience() {
	setStatus('Loading experience…', 'active');

	const Experience = window.Liforma?.Experience;
	if (!Experience) {
		throw new Error(
			'Liforma SDK not loaded. Ensure https://cdn.liforma.ai/sdk/v2/client.js is included in the page.'
		);
	}

	experience = await Experience.startSession({
		experienceId: SPEAK_EXPERIENCE_ID,
		mode: 'presenter',
		speechInputMode: 'off'
	});

	if (!experienceHostEl) throw new Error('Experience host element missing.');

	let readyHandled = false;
	const handleReady = () => {
		if (readyHandled) return;
		readyHandled = true;
		if (experienceIdLabelEl) experienceIdLabelEl.textContent = SPEAK_EXPERIENCE_ID;
		setStatus('Tap Start experience in the player', 'default');
		log('Experience ready. Use the player start button to unlock audio.');
	};

	experience.on('ready', handleReady);
	experience.on('started', () => {
		sessionReady = true;
		setInputEnabled(true);
		setStatus('Ready — type a line and press Enter', 'active');
		log('Session started. Try enqueue vs interrupt with quick successive lines.');
	});
	experience.on('characterSpeechEnded', (event) => {
		if (event.reason === 'interrupted') {
			log(`characterSpeechEnded: interrupted — “${event.text}”`, 'interrupt');
		}
	});

	await experience.attach({
		container: experienceHostEl,
		startButton: {
			label: 'Start experience',
			ariaLabel: 'Start experience session and unlock audio',
			placement: 'bottom-center',
			variant: 'primary',
			appearance: {
				backgroundColor: '#5c4ae0',
				textColor: '#ffffff',
				borderRadiusPx: 999,
				size: 'large',
				shadow: 'soft'
			}
		},
		onPlayerStatusChange: (state) => {
			if (state === 'error') {
				setStatus('Experience error', 'warn');
				setInputEnabled(false);
			}
		}
	});

	if (!readyHandled) {
		handleReady();
	}
}

behaviorEnqueueEl?.addEventListener('change', updateBehaviorLabels);
behaviorInterruptEl?.addEventListener('change', updateBehaviorLabels);

speakFormEl?.addEventListener('submit', (event) => {
	event.preventDefault();
	handleSubmit(speakInputEl?.value ?? '');
});

burstBtnEl?.addEventListener('click', () => {
	if (!sessionReady) return;
	log('--- firing three lines without waiting ---');
	for (const line of DEMO_LINES) {
		queueSpeak(line);
	}
});

log('Speak playground: type text, press Enter, compare enqueue vs interrupt.');

void initExperience().catch((err) => {
	console.error(err);
	setStatus('Failed to load', 'warn');
	setInputEnabled(false);
	const message = err instanceof Error ? err.message : String(err);
	if (message === 'Failed to fetch' || message.includes('Failed to fetch')) {
		log(
			'Could not reach the Liforma API (often CORS or network). If mint returns 403, add this origin in the developer portal; if OPTIONS fails, ensure api.liforma.ai includes organization allowed origins in CORS.'
		);
	} else {
		log(message);
	}
});
