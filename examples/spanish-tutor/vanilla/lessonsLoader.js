const PRODUCTION_LESSONS_API = 'https://spanish-tutor.examples.liforma.ai/api/lessons';
const LOCAL_SVELTEKIT_LESSONS_API = 'http://localhost:4003/api/lessons';
const SPANISH_TUTOR_PORT = '4003';

/**
 * @returns {string}
 */
export function resolveLessonsApiUrl() {
	if (typeof window === 'undefined') {
		return PRODUCTION_LESSONS_API;
	}

	if (window.location.port === SPANISH_TUTOR_PORT) {
		return LOCAL_SVELTEKIT_LESSONS_API;
	}

	if (window.location.hostname === 'spanish-tutor.examples.liforma.ai') {
		return '/api/lessons';
	}

	return PRODUCTION_LESSONS_API;
}

/**
 * @param {typeof fetch} fetchFn
 * @returns {Promise<import('./lessons.js').Lesson[]>}
 */
export async function loadLessons(fetchFn = fetch) {
	const response = await fetchFn(resolveLessonsApiUrl());
	if (!response.ok) {
		throw new Error(`Lessons request failed with status ${response.status}.`);
	}

	const payload = await response.json();
	if (!Array.isArray(payload.lessons) || payload.lessons.length === 0) {
		throw new Error('Lessons response did not include any lessons.');
	}

	return payload.lessons;
}
