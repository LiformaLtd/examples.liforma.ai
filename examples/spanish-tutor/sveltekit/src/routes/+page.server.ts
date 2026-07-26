import type { PageServerLoad } from './$types';

import { loadLessons } from '$lib/loadLessons';

export const load: PageServerLoad = async ({ fetch }) => loadLessons(fetch);
