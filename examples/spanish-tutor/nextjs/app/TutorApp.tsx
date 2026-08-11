'use client';

/**
 * Spanish Tutor — Liforma integration entry point (read this file first).
 *
 * Session rules:
 * 1. Close-before-switch — lesson buttons and learning language are disabled while a session is active.
 * 2. Mount `<Experience>` only when the session is active; never change `experienceId` on a live embed.
 * 3. Pass `learningLocale` from the “I am learning” control (browser locale stays native/user).
 * 4. `onClose` ends the session and returns to idle.
 * 5. No API keys here — lessons are loaded on the server in `app/page.tsx`.
 */
import { useCallback, useMemo, useState, type ChangeEvent } from 'react';

import { Experience } from '@liforma/client/react';

import { LessonList } from '@/components/LessonList';
import {
	DEFAULT_LEARNING_LOCALE,
	LEARNING_LANGUAGE_OPTIONS,
	learningLanguageLabel
} from '@/lib/learningLanguages';
import type { LessonsSource } from '@/lib/loadLessons';
import { getLesson, type Lesson } from '@/lib/lessons';

type SessionStatus = 'idle' | 'active';

export type TutorAppProps = {
	lessons: Lesson[];
	source: LessonsSource;
	catalogWarning?: string;
};

export default function TutorApp({ lessons, source, catalogWarning }: TutorAppProps) {
	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
	const [learningLocale, setLearningLocale] = useState(DEFAULT_LEARNING_LOCALE);
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
		const learningLabel = learningLanguageLabel(learningLocale);
		setTranscriptNotes([
			`Session started for “${selectedLesson.title}”.`,
			`Learning language: ${learningLabel} (Experience learningLocale="${learningLocale}").`,
			'Allow microphone access when prompted to speak with your tutor.',
			'Transcript events from the SDK can be wired here in a production app.'
		]);
	}, [learningLocale, selectedLesson, sessionActive]);

	const handleEmbedClose = useCallback(() => {
		if (sessionStatus === 'active') {
			endSession();
		}
	}, [endSession, sessionStatus]);

	const onLearningChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			if (sessionActive) return;
			setLearningLocale(event.target.value);
		},
		[sessionActive]
	);

	const catalogNote = useMemo(() => {
		if (catalogWarning) {
			return `${catalogWarning} Showing static fallback lessons.`;
		}
		if (source === 'catalog') {
			return 'Lessons loaded from your Liforma project catalog.';
		}
		return null;
	}, [catalogWarning, source]);

	return (
		<div className="layout">
			<section className="sidebar" aria-label="Lessons">
				<h2>Lessons</h2>
				{catalogNote ? (
					<p className="catalog-note" role="status">
						{catalogNote}
					</p>
				) : null}
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

						<label className="learning-row">
							<span className="learning-label">I am learning:</span>
							<select
								className="learning-select"
								value={learningLocale}
								disabled={sessionActive}
								aria-label="I am learning"
								onChange={onLearningChange}
							>
								{LEARNING_LANGUAGE_OPTIONS.map((option) => (
									<option key={option.id} value={option.locale}>
										{option.label}
									</option>
								))}
							</select>
						</label>
						{sessionActive ? (
							<p className="learning-lock" role="status">
								End the session before changing the learning language.
							</p>
						) : (
							<p className="learning-hint">
								Passed to <code>&lt;Experience learningLocale&gt;</code>. Your browser language
								stays the native/user locale.
							</p>
						)}

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
									learningLocale={learningLocale}
									onClose={handleEmbedClose}
								/>
							</div>
						) : (
							<div className="experience-placeholder">
								<p>Select a lesson and start practice to load your tutor experience.</p>
								<p className="muted">
									Experience ID: <code>{experienceId}</code>
									{' · '}
									learningLocale: <code>{learningLocale}</code>
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
