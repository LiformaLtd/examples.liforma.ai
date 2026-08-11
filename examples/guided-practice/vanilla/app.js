import { buildPracticeFeedback } from './feedback.js';
import { PRACTICE_EXPERIENCE_ID, practiceScenario, practiceTurns } from './turns.js';

const experienceHostEl = document.getElementById('experience-host');
const statusPillEl = document.getElementById('status-pill');
const logListEl = document.getElementById('log-list');
const feedbackPanelEl = document.getElementById('feedback-panel');
const feedbackTitleEl = document.getElementById('feedback-title');
const feedbackDetailEl = document.getElementById('feedback-detail');
const transcriptPanelEl = document.getElementById('transcript-panel');
const transcriptTextEl = document.getElementById('transcript-text');
const turnTitleEl = document.getElementById('turn-title');
const turnHintEl = document.getElementById('turn-hint');
const experienceIdLabelEl = document.getElementById('experience-id-label');
const modeLabelEl = document.getElementById('mode-label');

const turnBtn = document.getElementById('btn-turn');

/** @type {import('@liforma/client').Experience | null} */
let experience = null;
let turnIndex = 0;
let lessonStarted = false;
let busy = false;

/** @type {'loading' | 'await_begin' | 'speaking' | 'await_start' | 'recording' | 'feedback' | 'complete' | 'error'} */
let phase = 'loading';

function log(line) {
	if (!logListEl) return;
	const li = document.createElement('li');
	li.textContent = line;
	logListEl.appendChild(li);
	logListEl.scrollTop = logListEl.scrollHeight;
}

function setStatus(text, tone = 'default') {
	if (!statusPillEl) return;
	statusPillEl.textContent = text;
	statusPillEl.dataset.tone = tone;
}

function hideFeedback() {
	feedbackPanelEl?.classList.add('hidden');
}

function showFeedback(result) {
	if (!feedbackPanelEl || !feedbackTitleEl || !feedbackDetailEl) return;
	feedbackTitleEl.textContent = result.summary;
	feedbackDetailEl.textContent = result.detail;
	feedbackPanelEl.dataset.tone = result.tone;
	feedbackPanelEl.classList.remove('hidden');
}

function hideTranscript() {
	transcriptPanelEl?.classList.add('hidden');
	if (transcriptTextEl) transcriptTextEl.textContent = '';
}

function showTranscript(text) {
	if (!transcriptPanelEl || !transcriptTextEl) return;
	transcriptTextEl.textContent = text.trim() || '(no speech detected)';
	transcriptPanelEl.classList.remove('hidden');
}

function currentTurn() {
	return practiceTurns[turnIndex];
}

function updateTurnCard() {
	const turn = currentTurn();
	if (!turnTitleEl || !turnHintEl) return;
	if (turnIndex >= practiceTurns.length) {
		turnTitleEl.textContent = 'Practice complete';
		turnHintEl.textContent = 'You finished all scripted turns.';
		return;
	}
	turnTitleEl.textContent = `Turn ${turnIndex + 1} of ${practiceTurns.length}`;
	turnHintEl.textContent = turn?.hint ?? '';
}

function setTurnButton() {
	if (!turnBtn) return;

	turnBtn.classList.remove('state-disabled', 'state-start', 'state-stop', 'state-next');

	if (phase === 'speaking') {
		turnBtn.disabled = true;
		turnBtn.textContent = 'Speaking…';
		turnBtn.classList.add('state-disabled');
		return;
	}

	if (phase === 'await_start') {
		turnBtn.disabled = busy;
		turnBtn.textContent = 'Start';
		turnBtn.classList.add('state-start');
		return;
	}

	if (phase === 'recording') {
		turnBtn.disabled = busy;
		turnBtn.textContent = 'Stop';
		turnBtn.classList.add('state-stop');
		return;
	}

	if (phase === 'feedback') {
		turnBtn.disabled = busy;
		turnBtn.textContent = 'Next';
		turnBtn.classList.add('state-next');
		return;
	}

	turnBtn.disabled = true;
	turnBtn.textContent = 'Start';
	turnBtn.classList.add('state-disabled');
}

function setButtons() {
	setTurnButton();
}

function setPhase(next) {
	phase = next;
	updateTurnCard();
	setButtons();
}

async function withBusy(fn) {
	if (busy) return;
	busy = true;
	setButtons();
	try {
		await fn();
	} finally {
		busy = false;
		setButtons();
	}
}

async function speakCurrentTutorLine() {
	const turn = currentTurn();
	if (!experience || !turn) return;
	hideFeedback();
	hideTranscript();
	setPhase('speaking');
	setStatus('Tutor speaking…', 'active');
	log(`Tutor: ${turn.tutorLine}`);
	await experience.speech.speak({ text: turn.tutorLine });
	setPhase('await_start');
	setStatus('Tap Start when you are ready to speak', 'default');
	log('Your turn — tap Start, speak, then Stop.');
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
		experienceId: PRACTICE_EXPERIENCE_ID,
		mode: 'presenter',
		speechInputMode: 'manual',
		onUserTranscript: (update) => {
			if (phase === 'recording' && update.text.trim() && transcriptTextEl) {
				transcriptTextEl.textContent = update.text.trim();
				transcriptPanelEl?.classList.remove('hidden');
			}
		}
	});

	if (!experienceHostEl) throw new Error('Experience host element missing.');

	let readyHandled = false;
	const handleReady = ({ session }) => {
		if (readyHandled) return;
		readyHandled = true;
		experienceIdLabelEl.textContent = PRACTICE_EXPERIENCE_ID;
		if (modeLabelEl && session) {
			modeLabelEl.textContent = `${session.mode} · locale ${session.locale}`;
		}

		if (session?.mode !== 'presenter') {
			log(
				'Warning: session mode is not presenter — the experience may run in conversation mode.'
			);
		}

		setPhase('await_begin');
		setStatus('Tap Begin lesson in the player', 'default');
		log('Experience ready. Use the player start button to begin the lesson.');
	};

	if (typeof experience.on === 'function') {
		experience.on('ready', handleReady);
		experience.on('started', () => {
			if (lessonStarted) return;
			lessonStarted = true;
			void withBusy(async () => {
				setStatus('Starting first tutor line…', 'active');
				log('Player unlocked audio and started the session.');
				await speakCurrentTutorLine();
			});
		});
	}

	await experience.attach({
		container: experienceHostEl,
		startButton: {
			label: 'Begin lesson',
			ariaLabel: 'Begin guided practice lesson',
			placement: 'bottom-center',
			variant: 'primary',
			appearance: {
				backgroundColor: '#2563eb',
				textColor: '#ffffff',
				borderRadiusPx: 999,
				size: 'large',
				shadow: 'strong'
			}
		},
		onStateUpdate: (state) => {
			if (state === 'error') {
				setPhase('error');
				setStatus('Experience error', 'warn');
			}
		}
	});

	if (!readyHandled) {
		handleReady({ manifest: experience.getManifest() });
	}
}

turnBtn?.addEventListener('click', () => {
	if (phase === 'await_start') {
		void withBusy(async () => {
			if (!experience) return;
			hideTranscript();
			await experience.startListening();
			setPhase('recording');
			setStatus('Recording… tap Stop when finished', 'active');
			log('Listening…');
		});
		return;
	}

	if (phase === 'recording') {
		void withBusy(async () => {
			const turn = currentTurn();
			if (!experience || !turn) return;
			const utterance = await experience.stopListening();
			showTranscript(utterance.text);
			const feedback = buildPracticeFeedback(turn.hint, utterance.text);
			showFeedback(feedback);
			setPhase('feedback');
			setStatus('Review your transcript and feedback, then Next', 'default');
			log(`You: ${utterance.text.trim() || '(empty)'}`);
			log(`Feedback: ${feedback.summary}`);
		});
		return;
	}

	if (phase === 'feedback') {
		void withBusy(async () => {
			turnIndex += 1;
			if (turnIndex >= practiceTurns.length) {
				setPhase('complete');
				setStatus('Practice complete', 'good');
				log('All turns complete.');
				return;
			}
			log(`--- Turn ${turnIndex + 1} ---`);
			await speakCurrentTutorLine();
		});
	}
});

if (logListEl) {
	logListEl.innerHTML = '';
	log('Scripted practice: canned tutor lines, button-gated recording, host-side feedback.');
}

if (turnTitleEl) turnTitleEl.textContent = practiceScenario.title;
if (turnHintEl) turnHintEl.textContent = practiceScenario.goal;

void initExperience().catch((err) => {
	console.error(err);
	setPhase('error');
	setStatus('Failed to load', 'warn');
	const message = err instanceof Error ? err.message : String(err);
	if (message === 'Failed to fetch' || message.includes('Failed to fetch')) {
		log(
			'Could not reach the Liforma API. Add http://localhost:4004 to your project allowed origins in the developer portal.'
		);
	} else {
		log(message);
	}
});
