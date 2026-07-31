import { env } from '$env/dynamic/private';

export type CatalogExperience = {
	readonly experienceId: string;
	readonly slug: string;
	readonly title: string;
	readonly sortOrder: number;
	readonly updatedAt: string;
	readonly catalogReady?: boolean;
};

type CatalogListResponse = {
	readonly experiences: readonly CatalogExperience[];
};

type CatalogDetailResponse = {
	readonly experience: CatalogExperience;
};

/** Seeded Examples project — stable across environments. */
export const DEFAULT_PROJECT_ID = 'seed_proj_examples';

function apiBaseUrl(): string {
	return (env.LIFORMA_API_URL ?? 'https://api.liforma.ai').replace(/\/$/, '');
}

function projectId(): string {
	return env.LIFORMA_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID;
}

function apiKey(): string | null {
	return env.LIFORMA_API_KEY?.trim() ?? null;
}

export function catalogConfigured(): boolean {
	return Boolean(apiKey());
}

export async function fetchProjectCatalog(fetchFn: typeof fetch): Promise<CatalogExperience[]> {
	const key = apiKey();
	if (!key) {
		throw new Error('LIFORMA_API_KEY is required for catalog fetch.');
	}

	const response = await fetchFn(
		`${apiBaseUrl()}/v1/projects/${encodeURIComponent(projectId())}/experiences`,
		{
			headers: {
				Authorization: `Bearer ${key}`
			}
		}
	);
	if (!response.ok) {
		throw new Error(`Catalog request failed with status ${response.status}.`);
	}
	const payload = (await response.json()) as CatalogListResponse;
	return [...payload.experiences];
}

export async function fetchProjectExperienceBySlug(
	fetchFn: typeof fetch,
	slug: string
): Promise<CatalogExperience | null> {
	const key = apiKey();
	if (!key) {
		throw new Error('LIFORMA_API_KEY is required for catalog fetch.');
	}

	const response = await fetchFn(
		`${apiBaseUrl()}/v1/projects/${encodeURIComponent(projectId())}/experiences/${encodeURIComponent(slug)}`,
		{
			headers: {
				Authorization: `Bearer ${key}`
			}
		}
	);
	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`Catalog detail request failed with status ${response.status}.`);
	}
	const payload = (await response.json()) as CatalogDetailResponse;
	return payload.experience;
}
