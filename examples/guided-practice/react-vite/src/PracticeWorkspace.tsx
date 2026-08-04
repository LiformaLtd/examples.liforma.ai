

import { useCallback, useMemo, useRef, useState } from 'react';

import type { ExperienceEvents, StartButtonOptions } from '@liforma/client';
import { Experience, type ExperienceHandle } from '@liforma/client/react';

import { buildPracticeFeedback, type PracticeFeedback } from './lib/feedback';
import { playerEmbedUrl } from './lib/liforma-stack';
import { PRACTICE_EXPERIENCE_ID, practiceTurns } from './lib/turns';

type Phase =
	| 'loading'
	| 'await_begin'
	| 'speaking'
	| 'await_start'
	| 'recording'
	| 'feedback'
	| 'complete'
	| 'error';

type StatusTone = 'default' | 'active' | 'good' | 'warn';

const startButton: StartButtonOptions = {
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
};

export function PracticeWorkspace() {
	const experienceRef = useRef<ExperienceHandle>(null);
	const [turnIndex, setTurnIndex] = useState(0);
	const [lessonStarted, setLessonStarted] = useState(false);
	const [busy, setBusy] = useState(false);
	const [phase, setPhase] = useState<Phase>('loading');
	const [statusText, setStatusText] = useState('Loading…');
	const [statusTone, setStatusTone] = useState<StatusTone>('default');
	const [logs, setLogs] = useState<string[]>([
		'Scripted practice: canned tutor lines, button-gated recording, host-side feedback.'
	]);
	const [transcriptText, setTranscriptText] = useState('');
	const [showTranscript, setShowTranscript] = useState(false);
	const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
	const [recordingActive, setRecordingActive] = useState(false);
	const [modeLabel, setModeLabel] = useState('presenter / manual / manual');

	const currentTurn = practiceTurns[turnIndex];

	const turnTitle =
		turnIndex >= practiceTurns.length
			? 'Practice complete'
			: `Turn ${turnIndex + 1} of ${practiceTurns.length}`;

	const turnHint =
		turnIndex >= practiceTurns.length
			? 'You finished all scripted turns.'
			: (currentTurn?.hint ?? '');

	const turnButtonLabel = useMemo(() => {
		if (phase === 'speaking') return 'Avatar speaking…';
		if (phase === 'await_start') return 'Start';
		if (phase === 'recording') return 'Stop';
		if (phase === 'feedback') return 'Next';
		return 'Start';
	}, [phase]);

	const turnButtonClass = useMemo(() => {
		if (phase === 'await_start') return 'state-start';
		if (phase === 'recording') return 'state-stop';
		if (phase === 'feedback') return 'state-next';
		return 'state-disabled';
	}, [phase]);

	const turnButtonDisabled =
		busy ||
		!lessonStarted ||
		phase === 'loading' ||
		phase === 'error' ||
		phase === 'complete' ||
		phase === 'await_begin' ||
		phase === 'speaking';

	const pushLog = useCallback((line: string) => {
		setLogs((prev) => [...prev, line]);
	}, []);

	const setStatus = useCallback((text: string, tone: StatusTone = 'default') => {
		setStatusText(text);
		setStatusTone(tone);
	}, []);

	const setPhaseState = useCallback((next: Phase) => {
		setPhase(next);
		setRecordingActive(next === 'recording');
	}, []);

	const withBusy = useCallback(async (fn: () => Promise<void>) => {
		if (busy) return;
		setBusy(true);
		try {
			await fn();
		} finally {
			setBusy(false);
		}
	}, [busy]);

	const speakCurrentTutorLine = useCallback(async () => {
		const turn = practiceTurns[turnIndex];
		const experience = experienceRef.current;
		if (!experience || !turn) return;
		setFeedback(null);
		setShowTranscript(false);
		setTranscriptText('');
		setPhaseState('speaking');
		setStatus('Tutor speaking…', 'active');
		pushLog(`Tutor: ${turn.tutorLine}`);
		await experience.speak({ text: turn.tutorLine });
		setPhaseState('await_start');
		setStatus('Tap Start when you are ready to speak', 'default');
		pushLog('Your turn — tap Start, speak, then Stop.');
	}, [pushLog, setPhaseState, setStatus, turnIndex]);

	const handleTurnButton = useCallback(async () => {
		if (phase === 'await_start') {
			await withBusy(async () => {
				const experience = experienceRef.current;
				if (!experience) return;
				setShowTranscript(false);
				setTranscriptText('');
				await experience.startListening();
				setPhaseState('recording');
				setStatus('Recording… tap Stop when finished', 'active');
				pushLog('Listening…');
			});
			return;
		}

		if (phase === 'recording') {
			await withBusy(async () => {
				const turn = practiceTurns[turnIndex];
				const experience = experienceRef.current;
				if (!experience || !turn) return;
				const utterance = await experience.stopListening();
				const text = utterance.text.trim() || '(no speech detected)';
				setTranscriptText(text);
				setShowTranscript(true);
				setFeedback(buildPracticeFeedback(turn.hint, utterance.text));
				setPhaseState('feedback');
				setStatus('Review your transcript and feedback, then Next', 'default');
				pushLog(`You: ${utterance.text.trim() || '(empty)'}`);
				pushLog(`Feedback: ${buildPracticeFeedback(turn.hint, utterance.text).summary}`);
			});
			return;
		}

		if (phase === 'feedback') {
			await withBusy(async () => {
				const nextIndex = turnIndex + 1;
				setTurnIndex(nextIndex);
				if (nextIndex >= practiceTurns.length) {
					setPhaseState('complete');
					setStatus('Practice complete', 'good');
					pushLog('All turns complete.');
					return;
				}
				pushLog(`--- Turn ${nextIndex + 1} ---`);
				const turn = practiceTurns[nextIndex];
				const experience = experienceRef.current;
				if (!experience || !turn) return;
				setFeedback(null);
				setShowTranscript(false);
				setTranscriptText('');
				setPhaseState('speaking');
				setStatus('Tutor speaking…', 'active');
				pushLog(`Tutor: ${turn.tutorLine}`);
				await experience.speak({ text: turn.tutorLine });
				setPhaseState('await_start');
				setStatus('Tap Start when you are ready to speak', 'default');
				pushLog('Your turn — tap Start, speak, then Stop.');
			});
		}
	}, [
		phase,
		pushLog,
		setPhaseState,
		setStatus,
		turnIndex,
		withBusy
	]);

	const handleReady = useCallback(
		({ manifest }: ExperienceEvents['ready']) => {
			setModeLabel(
				`${manifest.experience.mode} / ${manifest.experience.responseMode} / ${manifest.experience.speechInputMode}`
			);
			setPhaseState('await_begin');
			setStatus('Tap Begin lesson in the player', 'default');
			pushLog('Experience ready. Use the player start button to begin the lesson.');
		},
		[pushLog, setPhaseState, setStatus]
	);

	const handleTranscript = useCallback(
		(update: ExperienceEvents['userTranscript']) => {
			if (recordingActive && update.text.trim()) {
				setTranscriptText(update.text.trim());
				setShowTranscript(true);
			}
		},
		[recordingActive]
	);

	const handleStarted = useCallback(() => {
		if (lessonStarted) return;
		setLessonStarted(true);
		void withBusy(async () => {
			setStatus('Starting first tutor line…', 'active');
			pushLog('Player unlocked audio and started the session.');
			await speakCurrentTutorLine();
		});
	}, [lessonStarted, pushLog, setStatus, speakCurrentTutorLine, withBusy]);

	const handleStateUpdate = useCallback(
		(state: string) => {
			if (state === 'error') {
				setPhaseState('error');
				setStatus('Experience error', 'warn');
			}
		},
		[setPhaseState, setStatus]
	);

	const handleError = useCallback(
		(error: Error) => {
			setPhaseState('error');
			setStatus('Failed to load', 'warn');
			if (error.message.includes('Failed to fetch')) {
				pushLog(
					'Could not reach the Liforma API. Add http://localhost:4003 to your project allowed origins.'
				);
			} else {
				pushLog(error.message);
			}
		},
		[pushLog, setPhaseState, setStatus]
	);

	return (
		<div className="layout">
			<section className="workspace" aria-label="Practice">
				<div className="avatar-panel">
					<div className="avatar-host" aria-label="Liforma experience embed">
						<Experience
							ref={experienceRef}
							experienceId={PRACTICE_EXPERIENCE_ID}
							embedBaseUrl={playerEmbedUrl()}
							mode="presenter"
							speechInputMode="manual"
							startButton={startButton}
							onReady={handleReady}
							onStarted={handleStarted}
							onUserTranscript={handleTranscript}
							onStateUpdate={handleStateUpdate}
							onError={handleError}
						/>
					</div>
				</div>

				<div className="turn-card">
					<h2>{turnTitle}</h2>
					<p>{turnHint}</p>
					<p className="meta">
						Experience: <code>{PRACTICE_EXPERIENCE_ID}</code> · modes: <code>{modeLabel}</code>
					</p>
				</div>

				<div className="controls">
					<span className="status-pill" data-tone={statusTone}>{statusText}</span>
					<button
						type="button"
						className={`btn turn-btn ${turnButtonClass}`}
						disabled={turnButtonDisabled}
						aria-live="polite"
						onClick={() => void handleTurnButton()}
					>
						{turnButtonLabel}
					</button>
				</div>

				{showTranscript ? (
					<div className="transcript-panel" aria-live="polite">
						<h3>Your transcript</h3>
						<p>{transcriptText}</p>
					</div>
				) : null}

				{feedback ? (
					<div className="feedback-panel" data-tone={feedback.tone} aria-live="polite">
						<h3>{feedback.summary}</h3>
						<p>{feedback.detail}</p>
					</div>
				) : null}
			</section>

			<aside className="sidebar" aria-label="Session log">
				<h2>Session log</h2>
				<ul className="log-list">
					{logs.map((line, index) => (
						<li key={index}>{line}</li>
					))}
				</ul>
			</aside>
		</div>
	);
}
