/** @typedef {{ readonly id: string; readonly label: string; readonly locale: string }} LearningLanguageOption */

/** @type {readonly LearningLanguageOption[]} */
export const LEARNING_LANGUAGE_OPTIONS = [
	{ id: 'es', label: 'Spanish', locale: 'es-ES' },
	{ id: 'fr', label: 'French', locale: 'fr-FR' },
	{ id: 'de', label: 'German', locale: 'de-DE' },
	{ id: 'ja', label: 'Japanese', locale: 'ja-JP' }
];

export const DEFAULT_LEARNING_LOCALE = LEARNING_LANGUAGE_OPTIONS[0].locale;

/** @param {string} locale */
export function learningLanguageLabel(locale) {
	return LEARNING_LANGUAGE_OPTIONS.find((option) => option.locale === locale)?.label ?? locale;
}
