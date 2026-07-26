import { catalogConfigured, fetchProjectCatalog } from '$lib/liformaCatalog';
import { fallbackLessons, type Lesson } from '$lib/lessons';
import { lessonsFromCatalog } from '$lib/lessonsFromCatalog';

export type LessonsSource = 'catalog' | 'fallback';

export type LessonsLoadResult = {
	readonly lessons: Lesson[];
	readonly source: LessonsSource;
	readonly catalogWarning?: string;
};

export async function loadLessons(fetchFn: typeof fetch): Promise<LessonsLoadResult> {
	if (!catalogConfigured()) {
		return { lessons: [...fallbackLessons], source: 'fallback' };
	}

	try {
		const rows = await fetchProjectCatalog(fetchFn);
		if (rows.length === 0) {
			return {
				lessons: [...fallbackLessons],
				source: 'fallback',
				catalogWarning: 'Project catalog returned no published experiences.'
			};
		}

		return {
			lessons: lessonsFromCatalog(rows),
			source: 'catalog'
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn('[spanish-tutor] catalog fetch failed, using fallback lessons', {
			error: message
		});
		return {
			lessons: [...fallbackLessons],
			source: 'fallback',
			catalogWarning: 'Could not load project catalog.'
		};
	}
}
