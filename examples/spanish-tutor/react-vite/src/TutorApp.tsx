/**
 * Spanish Tutor — Liforma integration entry point (read this file first).
 *
 * Session rules:
 * 1. Close-before-switch — lesson buttons are disabled while a session is active.
 * 2. Mount `<Experience>` only when the session is active; never change `experienceId` on a live embed.
 * 3. `language="es"` for Spanish tutor scenarios.
 * 4. `onClose` ends the session and returns to idle.
 * 5. No API keys here — this Vite demo uses static `fallbackLessons` from `lib/lessons.ts`.
 */
import { useCallback, useState } from 'react';

import { Experience } from '@liforma/client/react';

import { LessonList } from './components/LessonList';
import {
	fallbackLessons,
	getLesson,
	SPANISH_TUTOR_LANGUAGE,
	type Lesson
} from './lib/lessons';

type SessionStatus = 'idle' | 'active';

const lessons: Lesson[] = fallbackLessons;

export default function TutorApp() {
	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
	const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
	const [transcriptNotes, setTranscriptNotes] = useState<string[]>([]);

	const effectiveSelectedLessonId = selectedLessonId ?? lessons[0]?.id ?? null;
	const selectedLesson = effectiveSelectedLessonId
		? getLesson(lessons, effectiveSelectedLessonId)
		: undefined;
	const sessionActive = sessionStatus === 'active';
	const experienceId = selectedLesson?.experienceId ?? lessons[0]?.experienceId ?? '';

	const selectLesson = useCallback(
		(id: string) => {
			if (sessionActive) return;
			setSelectedLessonId(id);
		},
		[sessionActive]
	);

	const endSession = useCallback(() => {
		setSessionStatus('idle');
		setTranscriptNotes((notes) => [
			...notes,
			'Session ended. Choose another lesson or start again.'
		]);
	}, []);

	const startSession = useCallback(() => {
		if (!selectedLesson || sessionActive) return;
		setSessionStatus('active');
		setTranscriptNotes([
			`Session started for “${selectedLesson.title}”.`,
			'Allow microphone access when prompted to speak with your tutor.',
			'Transcript events from the SDK can be wired here in a production app.'
		]);
	}, [selectedLesson, sessionActive]);

	const handleEmbedClose = useCallback(() => {
		if (sessionStatus === 'active') {
			endSession();
		}
	}, [endSession, sessionStatus]);

	return (
		<div className="layout">
			<section className="sidebar" aria-label="Lessons">
				<h2>Lessons</h2>
				<p className="catalog-note" role="status">
					Using static lessons from <code>lib/lessons.ts</code>. In production, load your catalog
					from a backend route (see the Next.js example).
				</p>
				<LessonList
					lessons={lessons}
					selectedId={effectiveSelectedLessonId}
					sessionActive={sessionActive}
					onSelect={selectLesson}
				/>
			</section>

			<section className="workspace" aria-label="Practice">
				{selectedLesson ? (
					<>
						<div className="goal-card">
							<p className="goal-label">Learning goal</p>
							<h2>{selectedLesson.title}</h2>
							<p>{selectedLesson.goal}</p>
						</div>

						<div className="status-row">
							<span className="status-pill" data-status={sessionStatus}>
								{sessionActive ? 'Session active' : 'Ready to practise'}
							</span>
							{sessionActive ? (
								<button type="button" className="btn secondary" onClick={endSession}>
									End session
								</button>
							) : (
								<button type="button" className="btn primary" onClick={startSession}>
									Start practice
								</button>
							)}
						</div>

						<div className="mic-note" role="note">
							<strong>Microphone:</strong> Your browser will ask for permission when the experience
							session starts. Use headphones in shared spaces.
						</div>

						{sessionActive ? (
							<div className="embed-shell">
								{/* Do not change experienceId while mounted — end session first (close-before-switch). */}
								<Experience
									experienceId={experienceId}
									language={SPANISH_TUTOR_LANGUAGE}
									onClose={handleEmbedClose}
								/>
							</div>
						) : (
							<div className="experience-placeholder">
								<p>Select a lesson and start practice to load your Spanish tutor experience.</p>
								<p className="muted">
									Experience ID: <code>{experienceId}</code>
								</p>
							</div>
						)}

						<div className="transcript-panel">
							<h3>Session notes</h3>
							{transcriptNotes.length === 0 ? (
								<p className="muted">
									Conversation notes and transcript lines appear here during a session.
								</p>
							) : (
								<ul>
									{transcriptNotes.map((note, index) => (
										<li key={index}>{note}</li>
									))}
								</ul>
							)}
						</div>
					</>
				) : (
					<p>Choose a lesson to begin.</p>
				)}
			</section>
		</div>
	);
}
