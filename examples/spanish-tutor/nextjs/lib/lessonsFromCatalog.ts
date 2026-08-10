import type { CatalogExperience } from '@/lib/liformaCatalog';
import { lessonDetailsBySlug, type Lesson } from '@/lib/lessons';

export function lessonFromCatalogRow(row: CatalogExperience): Lesson {
	const details = lessonDetailsBySlug[row.slug];

	return {
		id: row.slug,
		title: row.title,
		experienceId: row.experienceId,
		description: details?.description ?? `Practise Spanish in: ${row.title}.`,
		level: details?.level ?? 'Beginner',
		goal:
			details?.goal ??
			`Build confidence speaking Spanish in a ${row.title.toLowerCase()} scenario.`
	};
}

export function lessonsFromCatalog(rows: readonly CatalogExperience[]): Lesson[] {
	return rows.map((row) => lessonFromCatalogRow(row));
}
