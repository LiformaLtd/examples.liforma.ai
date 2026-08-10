# Speak playground examples

Type text and press Enter — the experience speaks it. Toggle enqueue vs interrupt on `speech.speak({ queue })`.

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4005 |
| Vanilla HTML | `vanilla/` | http://localhost:4005 |
| Next.js | `nextjs/` | http://localhost:4005 |
| React (Vite) | `react-vite/` | http://localhost:4005 |

**Read first in React/Next:** `SpeakWorkspace.tsx` / `SpeakApp.tsx`.  
**Canonical speak API:** `experience.speech.speak({ text, queue: 'append' | 'replace-active' })`.

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
