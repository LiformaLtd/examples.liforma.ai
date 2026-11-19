/**
 * The examples as website knowledge for the "Talk with Liforma" avatar (published at /knowledge.json, built with the
 * site). One Markdown document per example, made from what already explains it in words: the example's README, its spec
 * and each framework's README, plus only the code files that talk to Liforma (the ones a README says to copy into your
 * product, or that use @liforma/client, <Experience> or <liforma-experience>), each under a sentence saying what it is.
 * Demo scaffolding, servers, configs and styles are left out: a voice avatar explains the code and gives the link, it
 * does not read 200 lines aloud. The full source stays on GitHub and in the hosted demos.
 *
 * The files are read during the build only: the route that uses this (/knowledge.json) is prerendered, so nothing
 * here runs on Vercel at request time.
 */

import fs from 'node:fs';
import path from 'node:path';

const FRAMEWORKS: Record<string, string> = {
	sveltekit: 'SvelteKit',
	vanilla: 'Vanilla HTML/JS',
	nextjs: 'Next.js',
	'react-vite': 'React (Vite)'
};
const CODE = /\.(svelte|tsx|ts|js|mjs|html)$/;
const SKIP =
	/(^|\/)(vite\.config|svelte\.config|next\.config|next-env\.d|app\.d|vite-env\.d|css\.d|main\.tsx$|app\.html$|layout\.tsx$|\+layout\.svelte$|favicon|eslint\.config)/;
const FENCE: Record<string, string> = { svelte: 'svelte', tsx: 'tsx', ts: 'ts', js: 'js', mjs: 'js', html: 'html' };
/** An integration file longer than this is demo UI around the integration, not the integration itself. */
const EXPLAINED_CAP = 3_000;
const TALKS_TO_LIFORMA = /@liforma\/client|<Experience\b|<liforma-experience|liforma\.ai\/sdk/;

/** Build output and installed packages inside an example, never part of its source. */
const IGNORED_DIRS = new Set(['node_modules', '.svelte-kit', '.next', '.vercel', 'dist', 'build']);
const KNOWLEDGE_FILE = /\.(md|svelte|tsx|ts|js|mjs|html)$/;

/** Every source file under examples/, read once during the build (only a prerendered route uses this module). */
function readExampleFiles(): Record<string, string> {
	const root = path.resolve('examples');
	const out: Record<string, string> = {};
	const walk = (dir: string) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (IGNORED_DIRS.has(entry.name)) continue;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (KNOWLEDGE_FILE.test(entry.name)) {
				out[`/examples/${path.relative(root, full).split(path.sep).join('/')}`] = fs.readFileSync(full, 'utf8');
			}
		}
	};
	walk(root);
	return out;
}

const clean = (text: string | undefined) => (text ?? '').replace(/\r\n/g, '\n').trim();
/** Push a README's headings down so they sit under the section they are placed in. */
const demote = (md: string, by: number) => md.replace(/^(#{1,5}) /gm, (_, h: string) => `${'#'.repeat(Math.min(6, h.length + by))} `);
const dropTitle = (md: string) => md.replace(/^# .*\n+/, '');
/** Files a README tells developers to copy into their product, e.g. "**Copy into your product:** `helloByo.ts`". */
const copyTargets = (readme: string) =>
	new Set(
		[...readme.matchAll(/copy (?:this )?into your product[^\n]*/gi)].flatMap((m) =>
			[...m[0].matchAll(/`([\w.+-]+\.\w+)`/g)].map((x) => x[1]!)
		)
	);
/** Same order as a sorted directory walk (the order the tested knowledge pack was built in). */
const walkOrder = (a: string, b: string) => {
	const ka = a.replace(/\//g, '\\');
	const kb = b.replace(/\//g, '\\');
	return ka < kb ? -1 : ka > kb ? 1 : 0;
};

export type KnowledgeDocument = { key: string; title: string; url: string; markdown: string };

export function examplesKnowledge(): KnowledgeDocument[] {
	const files = readExampleFiles();
	// One example per folder under examples/ (a file directly in examples/, such as index.html, is not an example).
	const slugs = [...new Set(Object.keys(files).filter((p) => p.split('/').length > 3).map((p) => p.split('/')[2]!))].sort();
	return slugs.map((slug) => {
		const dir = `/examples/${slug}`;
		const readme = clean(files[`${dir}/README.md`]);
		const spec = clean(files[`${dir}/spec.md`]);
		const title = readme.match(/^# (.+)$/m)?.[1]?.trim() ?? slug;
		const url = `https://${slug}.examples.liforma.ai/`;
		const seen = new Set<string>(); // the same helper file is copied into every framework: keep the first copy only
		const parts = [`# Liforma example: ${title}`, '', `Example \`${slug}\` from the Liforma examples. Hosted demo: ${url}`, ''];
		if (readme) parts.push('## Overview', '', demote(dropTitle(readme), 1), '');
		if (spec) parts.push('## What it does (spec)', '', demote(dropTitle(spec), 2), '');
		for (const [fw, label] of Object.entries(FRAMEWORKS)) {
			const fwDir = `${dir}/${fw}/`;
			const fwFiles = Object.keys(files).filter((p) => p.startsWith(fwDir)).sort(walkOrder);
			if (!fwFiles.length) continue;
			parts.push(`## ${label} version`, '');
			const fwReadme = clean(files[`${fwDir}README.md`]);
			if (fwReadme) parts.push(demote(dropTitle(fwReadme), 2), '');
			const copy = copyTargets(`${readme}\n${fwReadme}\n${spec}`);
			for (const file of fwFiles) {
				const rel = file.slice(fwDir.length);
				if (!CODE.test(rel) || SKIP.test(rel)) continue;
				// Styles say nothing a visitor asks about, and they are often half of a Svelte or HTML file.
				const code = clean(files[file]).replace(/<style[\s\S]*?<\/style>/g, '').replace(/\n{3,}/g, '\n\n').trim();
				if (!code) continue;
				const base = rel.split('/').pop()!;
				const isCopy = copy.has(base);
				if (!(isCopy || TALKS_TO_LIFORMA.test(code)) || code.length > EXPLAINED_CAP) continue;
				const key = code.replace(/\s+/g, ' ').replace(/\.(ts|js)'/g, "'");
				if (seen.has(key)) continue;
				seen.add(key);
				const ext = rel.split('.').pop()!;
				parts.push(`### ${label}: \`${rel}\``, '');
				parts.push(
					isCopy
						? `\`${base}\` is the file to copy into your own product from the ${label} version of this example.`
						: `\`${base}\` is where the ${label} version of this example connects to Liforma.`,
					''
				);
				parts.push('```' + FENCE[ext], code, '```', '');
			}
		}
		const markdown = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
		return { key: `examples/${slug}`, title: `Liforma example: ${title}`, url, markdown };
	});
}
