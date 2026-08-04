import { BASIC_EMBED_EXPERIENCE_ID } from './config.js';
import { loadLiformaSdk } from './shared/loadLiformaSdk.js';

await loadLiformaSdk({ build: '7' });

const embed = document.createElement('liforma-experience');
embed.setAttribute('experience-id', BASIC_EMBED_EXPERIENCE_ID);
document.querySelector('.experience')?.append(embed);
