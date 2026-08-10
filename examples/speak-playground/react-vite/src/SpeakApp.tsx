/**
 * Liforma speak() integration — read this file first.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Experience, type ExperienceHandle } from '@liforma/client/react';

import { DEMO_LINES, SPEAK_EXPERIENCE_ID } from './lib/config';

type LogKind = 'info' | 'speak' | 'end' | 'interrupt';

type LogEntry = {
	id: number;
	text: string;
	kind: LogKind;
};

type StatusTone = 'default' | 'active' | 'warn';

const START_BUTTON = {
	label: 'Start experience',
	ariaLabel: 'Start experience session and unlock audio',
	placement: 'bottom-center' as const,
	variant: 'primary' as const,
	appearance: {
		backgroundColor: '#5c4ae0',
		textColor: '#ffffff',
		borderRadiusPx: 999,
		size: 'large' as const,
		shadow: 'soft' as const
	}
};

export function SpeakApp() {
	const experienceRef = useRef<ExperienceHandle | null>(null);
	const logIdRef = useRef(0);
	const [sessionReady, setSessionReady] = useState(false);
	const [interrupt, setInterrupt] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const [status, setStatus] = useState({ text: 'Loading…', tone: 'default' as StatusTone });
	const [logs, setLogs] = useState<LogEntry[]>([]);

	const log = useCallback((text: string, kind: LogKind = 'info') => {
		logIdRef.current += 1;
		setLogs((prev) => [...prev, { id: logIdRef.current, text, kind }]);
	}, []);

	useEffect(() => {
		log('Speak playground: type text, press Enter, compare enqueue vs interrupt.');
	}, [log]);

	const queueSpeak = useCallback(
		(text: string) => {
			const trimmed = text.trim();
			if (!trimmed || !experienceRef.current) return;

			const queue = interrupt ? 'replace-active' : 'append';
			log(`speech.speak({ queue: '${queue}' }): “${trimmed}”`, 'speak');

			void experienceRef.current.speech
				.speak({ text: trimmed, queue })
				.then((result) => {
					log(`completed (${result.durationMs}ms): “${result.transcript ?? trimmed}”`, 'end');
				})
				.catch((err: unknown) => {
					if (err instanceof DOMException && err.name === 'AbortError') {
						log(`interrupted: “${trimmed}”`, 'interrupt');
						return;
					}
					const message = err instanceof Error ? err.message : String(err);
					log(`error: ${message}`, 'interrupt');
				});
		},
		[interrupt, log]
	);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		const trimmed = inputValue.trim();
		if (!trimmed || !sessionReady) return;
		queueSpeak(trimmed);
		setInputValue('');
	};

	const handleBurst = () => {
		if (!sessionReady) return;
		log('--- firing three lines without waiting ---');
		for (const line of DEMO_LINES) {
			queueSpeak(line);
		}
	};

	return (
		<div className="layout">
			<section className="workspace" aria-label="Speak playground">
				<div className="experience-panel">
					<div className="experience-host" aria-label="Liforma experience embed">
						<Experience
							ref={experienceRef}
							experienceId={SPEAK_EXPERIENCE_ID}
							mode="presenter"
							speechInputMode="off"
							startButton={START_BUTTON}
							onReady={() => {
								setStatus({ text: 'Tap Start experience in the player', tone: 'default' });
								log('Experience ready. Use the player start button to unlock audio.');
							}}
							onStarted={() => {
								setSessionReady(true);
								setStatus({ text: 'Ready — type a line and press Enter', tone: 'active' });
								log('Session started. Try enqueue vs interrupt with quick successive lines.');
							}}
							onCharacterSpeechEnded={(event) => {
								if (event.reason === 'interrupted') {
									log(`characterSpeechEnded: interrupted — “${event.text}”`, 'interrupt');
								}
							}}
							onStateUpdate={(state) => {
								if (state === 'error') {
									setStatus({ text: 'Experience error', tone: 'warn' });
									setSessionReady(false);
								}
							}}
							onError={(error) => {
								setStatus({ text: 'Failed to load', tone: 'warn' });
								setSessionReady(false);
								const message = error.message;
								if (message === 'Failed to fetch' || message.includes('Failed to fetch')) {
									log(
										'Could not reach the Liforma API (often CORS or network). If mint returns 403, add this origin in the developer portal; if OPTIONS fails, ensure api.liforma.ai includes organization allowed origins in CORS.'
									);
								} else {
									log(message);
								}
							}}
						/>
					</div>
				</div>

				<div className="control-card">
					<h2>Speech behavior</h2>
					<p>
						<strong>Enqueue</strong> waits for the current line to finish. <strong>Interrupt</strong>{' '}
						stops active speech and clears the queue before the new line.
					</p>
					<div className="behavior-toggle" role="radiogroup" aria-label="Speak behavior">
						<label
							className={`behavior-option${!interrupt ? ' is-selected' : ''}`}
							id="label-enqueue"
						>
							<input
								type="radio"
								name="behavior"
								id="behavior-enqueue"
								value="enqueue"
								checked={!interrupt}
								onChange={() => setInterrupt(false)}
							/>
							Enqueue
						</label>
						<label
							className={`behavior-option${interrupt ? ' is-selected' : ''}`}
							id="label-interrupt"
						>
							<input
								type="radio"
								name="behavior"
								id="behavior-interrupt"
								value="interrupt"
								checked={interrupt}
								onChange={() => setInterrupt(true)}
							/>
							Interrupt
						</label>
					</div>

					<form className="speak-form" id="speak-form" onSubmit={handleSubmit}>
						<input
							type="text"
							id="speak-input"
							className="speak-input"
							placeholder="Type something for the experience to say…"
							autoComplete="off"
							disabled={!sessionReady}
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
						/>
						<button type="submit" className="btn btn-primary" id="btn-speak" disabled={!sessionReady}>
							Speak
						</button>
					</form>

					<div className="demo-actions">
						<button
							type="button"
							className="btn"
							id="btn-burst"
							disabled={!sessionReady}
							onClick={handleBurst}
						>
							Fire 3 lines quickly
						</button>
					</div>

					<p className="meta">
						<span id="status-pill" className="status-pill" data-tone={status.tone}>
							{status.text}
						</span>
						· Experience: <code id="experience-id-label">{SPEAK_EXPERIENCE_ID}</code>
					</p>
				</div>
			</section>

			<aside className="sidebar" aria-label="Session log">
				<h2>Session log</h2>
				<ul id="log-list" className="log-list">
					{logs.map((entry) => (
						<li key={entry.id} data-kind={entry.kind === 'info' ? undefined : entry.kind}>
							{entry.text}
						</li>
					))}
				</ul>
			</aside>
		</div>
	);
}
