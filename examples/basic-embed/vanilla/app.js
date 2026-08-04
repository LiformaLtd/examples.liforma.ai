import { BASIC_EMBED_EXPERIENCE_ID } from './config.js';
import { loadLiformaSdk } from './shared/loadLiformaSdk.js';

const host = document.getElementById('experience-host');
const statusPill = document.getElementById('status-pill');
const experienceIdLabel = document.getElementById('experience-id-label');

if (experienceIdLabel) {
	experienceIdLabel.textContent = BASIC_EMBED_EXPERIENCE_ID;
}

function setStatus(text) {
	if (statusPill) statusPill.textContent = text;
}

async function main() {
	if (!host) throw new Error('Missing #experience-host');

	setStatus('Loading SDK…');
	await loadLiformaSdk({ build: '6' });

	const embed = document.createElement('liforma-experience');
	embed.setAttribute('experience-id', BASIC_EMBED_EXPERIENCE_ID);
	host.replaceChildren(embed);
	setStatus('Ready — use the player start button');
}

main().catch((err) => {
	console.error(err);
	setStatus('Failed to load');
	const message = err instanceof Error ? err.message : String(err);
	const note = document.createElement('p');
	note.className = 'error-note';
	note.textContent = message;
	host?.append(note);
});
