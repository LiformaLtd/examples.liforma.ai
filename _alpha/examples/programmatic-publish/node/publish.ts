import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createPublisher } from '@liforma/publisher';

/**
 * Local-only Node CLI (port reserved: 4011 — no HTTP server; CLI only).
 *
 *   export LIFORMA_API_KEY=lfm_live_…
 *   export LIFORMA_PROJECT_ID=proj_…
 *   npm start -- --lobby ./lobby.png --clothes ./clothes.png --hair ./hair.png
 */

function arg(name: string): string | undefined {
	const idx = process.argv.indexOf(`--${name}`);
	if (idx < 0) return undefined;
	return process.argv[idx + 1];
}

function requireArg(name: string): string {
	const value = arg(name)?.trim();
	if (!value) {
		throw new Error(`Missing --${name} <path>`);
	}
	return value;
}

const projectId = process.env.LIFORMA_PROJECT_ID?.trim();
const apiKey = process.env.LIFORMA_API_KEY?.trim();
if (!projectId || !apiKey) {
	console.error('Set LIFORMA_API_KEY and LIFORMA_PROJECT_ID');
	process.exit(1);
}

const lobbyPath = requireArg('lobby');
const clothesPath = requireArg('clothes');
const hairPath = requireArg('hair');
const title = arg('title')?.trim() || 'Hotel check-in';

const publisher = createPublisher(projectId, {
	apiKey,
	baseUrl: process.env.LIFORMA_API_URL?.trim() || undefined
});

const avatars = await publisher.listAvatars();
const avatar = avatars[0];
if (!avatar) {
	throw new Error('No costume avatars available on this project.');
}

const stamp = createHash('sha1').update(`${Date.now()}`).digest('hex').slice(0, 8);
const lobbyBytes = readFileSync(path.resolve(lobbyPath));
const clothesBytes = readFileSync(path.resolve(clothesPath));
const hairBytes = readFileSync(path.resolve(hairPath));

const background = await publisher.uploadImage(lobbyBytes, { contentType: 'image/png' });
const backdrop = await publisher.createBackdrop({
	name: 'Hotel lobby',
	image: background,
	externalId: `example-bdrop-${stamp}`,
	onProgress: (job) => console.log('backdrop job', job.status, job.stage ?? '')
});
const set = await publisher.createSet({
	name: 'Hotel lobby',
	backdropId: backdrop.id,
	externalId: `example-set-${stamp}`
});

const clothesImage = await publisher.uploadImage(clothesBytes, { contentType: 'image/png' });
const hairImage = await publisher.uploadImage(hairBytes, { contentType: 'image/png' });
const [clothes, hair] = await Promise.all([
	publisher.createClothes({
		avatarId: avatar.id,
		image: clothesImage,
		backgroundMode: 'remove',
		externalId: `example-clothes-${stamp}`
	}),
	publisher.createHair({
		avatarId: avatar.id,
		image: hairImage,
		backgroundMode: 'remove',
		externalId: `example-hair-${stamp}`
	})
]);

const character = await publisher.createCharacter({
	avatarId: avatar.id,
	name: 'Front desk',
	voice: avatar.defaultVoiceId,
	sttLang: avatar.defaultSttLang,
	clothesId: clothes.id,
	hairId: hair.id,
	externalId: `example-char-${stamp}`
});

const experience = await publisher.createExperience({
	title,
	characterId: character.id,
	setId: set.id,
	publish: true,
	externalId: `example-exp-${stamp}`
});

console.log(
	JSON.stringify(
		{
			experienceId: experience.id,
			slug: experience.slug,
			published: experience.published,
			characterId: character.id,
			setId: set.id,
			backdropId: backdrop.id
		},
		null,
		2
	)
);
