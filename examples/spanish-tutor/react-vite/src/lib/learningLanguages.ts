/** Options for the “I am learning” control → Experience `learningLocale`. */
export type LearningLanguageOption = {
	readonly id: string;
	readonly label: string;
	/** BCP 47 tag passed as `learningLocale`. */
	readonly locale: string;
};

export const LEARNING_LANGUAGE_OPTIONS: readonly LearningLanguageOption[] = [
	{ id: 'es', label: 'Spanish', locale: 'es-ES' },
	{ id: 'fr', label: 'French', locale: 'fr-FR' },
	{ id: 'de', label: 'German', locale: 'de-DE' },
	{ id: 'ja', label: 'Japanese', locale: 'ja-JP' }
];

export const DEFAULT_LEARNING_LOCALE = LEARNING_LANGUAGE_OPTIONS[0]!.locale;

export function learningLanguageLabel(locale: string): string {
	return (
		LEARNING_LANGUAGE_OPTIONS.find((option) => option.locale === locale)?.label ?? locale
	);
}
