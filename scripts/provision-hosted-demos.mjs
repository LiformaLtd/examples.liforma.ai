#!/usr/bin/env node
/**
 * Idempotently create Vercel projects + domains for hosted example demos.
 *
 * Usage:
 *   VERCEL_TOKEN=… VERCEL_TEAM_ID=team_uYCi0RTUn1ajWWcM8edZT2BT \
 *     node scripts/provision-hosted-demos.mjs [--deploy]
 *
 * Requires a fresh Vercel token (Dashboard → Settings → Tokens).
 * Git-linked deploys need the examples repo connected once in the Vercel UX
 * (or via `npx vercel link` in each sveltekit folder).
 *
 * See docs/plans/2026/08/hosted-examples-demos.plan.md
 */

const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_uYCi0RTUn1ajWWcM8edZT2BT';
const TOKEN = process.env.VERCEL_TOKEN || '';
const DEPLOY = process.argv.includes('--deploy');
const DRY = process.argv.includes('--dry-run');

/** @type {{ slug: string; mode: 'live' | 'local-only'; env?: string[] }[]} */
const DEMOS = [
	{ slug: 'basic-embed', mode: 'live' },
	{ slug: 'experience-widget', mode: 'live' },
	{ slug: 'spanish-tutor', mode: 'live', env: ['LIFORMA_API_KEY'] },
	{ slug: 'guided-practice', mode: 'live' },
	{ slug: 'speak-playground', mode: 'live' },
	{ slug: 'elevenlabs-embed', mode: 'live', env: ['ELEVENLABS_API_KEY'] },
	{ slug: 'openai-realtime-embed', mode: 'live', env: ['OPENAI_API_KEY'] },
	{ slug: 'deepgram-embed', mode: 'local-only' },
	{ slug: 'livekit-embed', mode: 'live', env: ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] },
	{ slug: 'gemini-live-embed', mode: 'local-only' }
];

const API = 'https://api.vercel.com';

async function api(path, options = {}) {
	const url = new URL(path, API);
	url.searchParams.set('teamId', TEAM_ID);
	const res = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			'Content-Type': 'application/json',
			...(options.headers || {})
		}
	});
	const text = await res.text();
	let body;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = text;
	}
	if (!res.ok) {
		const msg = typeof body === 'object' ? JSON.stringify(body) : String(body);
		throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${msg}`);
	}
	return body;
}

async function listProjects() {
	const body = await api('/v9/projects?limit=100');
	return body.projects || [];
}

async function ensureProject(slug) {
	const name = `${slug}.examples.liforma.ai`;
	const existing = (await listProjects()).find((p) => p.name === name);
	if (existing) {
		console.log(`✓ project exists: ${name} (${existing.id})`);
		return existing;
	}
	if (DRY) {
		console.log(`[dry-run] would create project ${name}`);
		return { id: 'dry', name };
	}
	const created = await api('/v10/projects', {
		method: 'POST',
		body: JSON.stringify({
			name,
			framework: 'sveltekit',
			gitRepository: {
				type: 'github',
				repo: 'LiformaLtd/examples.liforma.ai'
			},
			rootDirectory: `examples/${slug}/sveltekit`,
			buildCommand: 'npm run build',
			installCommand: 'npm install',
			publicSource: true
		})
	});
	console.log(`+ created project: ${name} (${created.id})`);
	return created;
}

async function ensureDomain(projectId, slug) {
	const domain = `${slug}.examples.liforma.ai`;
	if (DRY) {
		console.log(`[dry-run] would add domain ${domain}`);
		return;
	}
	try {
		await api(`/v10/projects/${projectId}/domains`, {
			method: 'POST',
			body: JSON.stringify({ name: domain })
		});
		console.log(`+ domain: ${domain}`);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (message.includes('already') || message.includes('409')) {
			console.log(`✓ domain exists: ${domain}`);
			return;
		}
		console.warn(`! domain ${domain}: ${message}`);
	}
}

async function main() {
	if (!TOKEN) {
		console.error(`Missing VERCEL_TOKEN.

Create a token at https://vercel.com/account/tokens then:

  export VERCEL_TOKEN=…
  export VERCEL_TEAM_ID=${TEAM_ID}
  node scripts/provision-hosted-demos.mjs

Optional: --deploy (triggers production deploy after create)
         --dry-run
`);
		process.exit(1);
	}

	console.log(`Team ${TEAM_ID}`);
	console.log(`Demos: ${DEMOS.length}`);
	console.log('');

	for (const demo of DEMOS) {
		console.log(`--- ${demo.slug} (${demo.mode}) ---`);
		const project = await ensureProject(demo.slug);
		if (project.id && project.id !== 'dry') {
			await ensureDomain(project.id, demo.slug);
		}
		if (demo.env?.length) {
			console.log(`  env needed: ${demo.env.join(', ')}`);
		}
		if (DEPLOY && project.id && project.id !== 'dry') {
			console.log('  (use Vercel dashboard or `npx vercel --prod` in the sveltekit folder to deploy)');
		}
		console.log('');
	}

	console.log('Manual checklist:');
	console.log('1. Confirm DNS wildcard *.examples.liforma.ai → Vercel (or per-slug CNAMEs)');
	console.log('2. Set vendor env secrets for ElevenLabs / OpenAI / LiveKit projects');
	console.log('3. Push main so git-connected projects build');
	console.log('4. Gallery liveAppUrl already points at https://{slug}.examples.liforma.ai/');
	console.log('');
	console.log('Org allowlist https://*.liforma.ai already covers nested example hosts.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
