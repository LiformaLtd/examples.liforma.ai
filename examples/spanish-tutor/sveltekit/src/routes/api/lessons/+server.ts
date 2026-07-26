import { json, type RequestHandler } from '@sveltejs/kit';

import { loadLessons } from '$lib/loadLessons';

export const GET: RequestHandler = async ({ fetch }) => {
	const result = await loadLessons(fetch);
	return json(result, {
		headers: {
			'Cache-Control': 'public, max-age=60',
			'Access-Control-Allow-Origin': '*'
		}
	});
};
