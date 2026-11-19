/**
 * The examples as website knowledge, built with the site: https://examples.liforma.ai/knowledge.json
 *
 * The Liforma API reads this file after an examples deploy and stores it as part of the website knowledge pack that the
 * "Talk with Liforma" avatar answers from. Format "liforma-site-knowledge/1", shared by every site that publishes
 * knowledge: { format, source, site, commit, documents: [{ key, title, url, markdown }] }. See $lib/server/knowledge.
 */
import { json } from '@sveltejs/kit';

import { examplesKnowledge } from '$lib/server/knowledge';

export const prerender = true;

export function GET() {
	return json({
		format: 'liforma-site-knowledge/1',
		source: 'examples',
		site: 'https://examples.liforma.ai',
		commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
		documents: examplesKnowledge()
	});
}
