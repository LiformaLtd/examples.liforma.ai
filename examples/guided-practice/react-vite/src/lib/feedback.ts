export type PracticeFeedback = {
	readonly summary: string;
	readonly detail: string;
	readonly tone: 'good' | 'neutral' | 'warn';
};

export function buildPracticeFeedback(expectedHint: string, spokenText: string): PracticeFeedback {
	const spoken = spokenText.trim();
	if (!spoken) {
		return {
			summary: 'No speech detected.',
			detail: 'Tap Start, speak your answer, then tap Stop before releasing the microphone.',
			tone: 'warn'
		};
	}

	const normalized = spoken.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '');
	const hintWords = expectedHint
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, '')
		.split(/\s+/)
		.filter((word) => word.length > 3);

	const hits = hintWords.filter((word) => normalized.includes(word)).length;
	const ratio = hintWords.length > 0 ? hits / hintWords.length : 0;

	if (ratio >= 0.4) {
		return {
			summary: 'Nice response!',
			detail: `You said: “${spoken}”. ${expectedHint}`,
			tone: 'good'
		};
	}

	return {
		summary: 'Keep practising',
		detail: `You said: “${spoken}”. ${expectedHint}`,
		tone: 'neutral'
	};
}
