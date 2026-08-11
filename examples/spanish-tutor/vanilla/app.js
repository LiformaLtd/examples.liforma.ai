import { fallbackLessons } from './lessons.js';
import {
	DEFAULT_LEARNING_LOCALE,
	LEARNING_LANGUAGE_OPTIONS,
	learningLanguageLabel
} from './learningLanguages.js';
import { loadLessons } from './lessonsLoader.js';

const lessonListEl = document.getElementById('lesson-list');
const catalogNoteEl = document.getElementById('catalog-note');
const lockNoteEl = document.getElementById('lock-note');
const lessonTitleEl = document.getElementById('lesson-title');
const lessonGoalEl = document.getElementById('lesson-goal');
const statusPillEl = document.getElementById('status-pill');
const sessionBtnEl = document.getElementById('session-btn');
const embedRegionEl = document.getElementById('embed-region');
const experiencePlaceholderEl = document.getElementById('experience-placeholder');
const experienceIdLabelEl = document.getElementById('experience-id-label');
const learningLocaleSelectEl = document.getElementById('learning-locale');
const learningLocaleLabelEl = document.getElementById('learning-locale-label');
const learningHintEl = document.getElementById('learning-hint');
const learningLockEl = document.getElementById('learning-lock');
const transcriptListEl = document.getElementById('transcript-list');

/** @type {import('./lessons.js').Lesson[]} */
let lessons = [...fallbackLessons];

/** @type {string | null} */
let selectedLessonId = lessons[0]?.id ?? null;
let learningLocale = DEFAULT_LEARNING_LOCALE;
let sessionActive = false;
/** @type {HTMLElement | null} */
let activeEmbed = null;

function getSelectedLesson() {
	return lessons.find((lesson) => lesson.id === selectedLessonId);
}

function addTranscriptLine(text) {
	const li = document.createElement('li');
	li.textContent = text;
	transcriptListEl?.appendChild(li);
}

function setCatalogNote(message) {
	if (!catalogNoteEl) return;
	if (!message) {
		catalogNoteEl.classList.add('hidden');
		catalogNoteEl.textContent = '';
		return;
	}
	catalogNoteEl.textContent = message;
	catalogNoteEl.classList.remove('hidden');
}

function renderLearningOptions() {
	if (!learningLocaleSelectEl) return;
	learningLocaleSelectEl.innerHTML = '';
	for (const option of LEARNING_LANGUAGE_OPTIONS) {
		const el = document.createElement('option');
		el.value = option.locale;
		el.textContent = option.label;
		if (option.locale === learningLocale) el.selected = true;
		learningLocaleSelectEl.appendChild(el);
	}
}

function renderLessonList() {
	if (!lessonListEl) return;
	lessonListEl.innerHTML = '';

	for (const lesson of lessons) {
		const li = document.createElement('li');
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'lesson-btn';
		button.disabled = sessionActive;
		button.setAttribute('aria-pressed', String(lesson.id === selectedLessonId));
		if (lesson.id === selectedLessonId) {
			button.classList.add('selected');
		}

		button.innerHTML = `
			<span class="lesson-top">
				<span class="lesson-title">${lesson.title}</span>
				<span class="lesson-level">${lesson.level}</span>
			</span>
			<span class="lesson-desc">${lesson.description}</span>
		`;

		button.addEventListener('click', () => {
			if (sessionActive) return;
			selectedLessonId = lesson.id;
			updateUi();
		});

		li.appendChild(button);
		lessonListEl.appendChild(li);
	}
}

function updateGoalCard() {
	const lesson = getSelectedLesson();
	if (!lesson || !lessonTitleEl || !lessonGoalEl || !experienceIdLabelEl) return;
	lessonTitleEl.textContent = lesson.title;
	lessonGoalEl.textContent = lesson.goal;
	experienceIdLabelEl.textContent = lesson.experienceId;
	if (learningLocaleLabelEl) {
		learningLocaleLabelEl.textContent = learningLocale;
	}
}

function updateSessionControls() {
	if (!statusPillEl || !sessionBtnEl || !lockNoteEl) return;

	if (learningLocaleSelectEl) {
		learningLocaleSelectEl.disabled = sessionActive;
	}
	learningHintEl?.classList.toggle('hidden', sessionActive);
	learningLockEl?.classList.toggle('hidden', !sessionActive);

	if (sessionActive) {
		statusPillEl.textContent = 'Session active';
		statusPillEl.dataset.status = 'active';
		sessionBtnEl.textContent = 'End session';
		sessionBtnEl.className = 'btn secondary';
		lockNoteEl.classList.remove('hidden');
	} else {
		statusPillEl.textContent = 'Ready to practise';
		delete statusPillEl.dataset.status;
		sessionBtnEl.textContent = 'Start practice';
		sessionBtnEl.className = 'btn primary';
		lockNoteEl.classList.add('hidden');
	}
}

function clearEmbed() {
	if (activeEmbed) {
		activeEmbed.removeEventListener('close', handleEmbedClose);
		activeEmbed.remove();
		activeEmbed = null;
	}
	if (experiencePlaceholderEl) {
		experiencePlaceholderEl.classList.remove('hidden');
	}
}

function mountEmbed() {
	const lesson = getSelectedLesson();
	if (!lesson || !embedRegionEl) return;

	clearEmbed();
	experiencePlaceholderEl?.classList.add('hidden');

	const embed = document.createElement('liforma-experience');
	embed.setAttribute('experience-id', lesson.experienceId);
	embed.setAttribute('learning-locale', learningLocale);
	embed.className = 'liforma-embed';
	embed.addEventListener('close', handleEmbedClose);
	embedRegionEl.appendChild(embed);
	activeEmbed = embed;
}

function startSession() {
	const lesson = getSelectedLesson();
	if (!lesson || sessionActive) return;
	sessionActive = true;
	const learningLabel = learningLanguageLabel(learningLocale);
	addTranscriptLine(`Session started for “${lesson.title}”.`);
	addTranscriptLine(
		`Learning language: ${learningLabel} (Experience learningLocale="${learningLocale}").`
	);
	addTranscriptLine('Allow microphone access when prompted to speak with your tutor.');
	mountEmbed();
	updateUi();
}

function endSession() {
	if (!sessionActive) return;
	sessionActive = false;
	clearEmbed();
	addTranscriptLine('Session ended. Choose another lesson or start again.');
	updateUi();
}

function handleEmbedClose() {
	endSession();
}

function handleSessionButtonClick() {
	if (sessionActive) {
		endSession();
	} else {
		startSession();
	}
}

function updateUi() {
	renderLessonList();
	updateGoalCard();
	updateSessionControls();
}

async function bootstrapLessons() {
	try {
		const loadedLessons = await loadLessons();
		lessons = loadedLessons;
		selectedLessonId = lessons[0]?.id ?? null;
		if (loadedLessons.length > 0) {
			setCatalogNote('Lessons loaded from your Liforma project catalog.');
		}
	} catch (error) {
		console.warn('Using fallback lessons', error);
		setCatalogNote('Could not load project catalog. Showing static fallback lessons.');
	}
	updateUi();
}

renderLearningOptions();
learningLocaleSelectEl?.addEventListener('change', () => {
	if (sessionActive) return;
	learningLocale = learningLocaleSelectEl.value || DEFAULT_LEARNING_LOCALE;
	updateGoalCard();
});

sessionBtnEl?.addEventListener('click', handleSessionButtonClick);

if (transcriptListEl) {
	transcriptListEl.innerHTML = '';
	addTranscriptLine('Conversation notes and transcript lines appear here during a session.');
}

bootstrapLessons();
