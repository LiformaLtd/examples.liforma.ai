import type { Metadata } from 'next';

import TutorApp from '@/app/TutorApp';
import { loadLessons } from '@/lib/loadLessons';

export const metadata: Metadata = {
	title: 'Spanish Tutor — Liforma Example',
	description:
		'Practise Spanish with an animated AI tutor. Lesson-based Liforma embed example.'
};

export default async function Page() {
	const { lessons, source, catalogWarning } = await loadLessons(fetch);

	return <TutorApp lessons={lessons} source={source} catalogWarning={catalogWarning} />;
}
