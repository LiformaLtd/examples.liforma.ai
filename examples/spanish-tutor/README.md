# Spanish Tutor examples

Lesson-based app pattern: the app chooses a lesson; the lesson chooses a Liforma Experience. An **I am learning** dropdown (default Spanish) sets Experience `learningLocale` so the same shell can demo French, German, Japanese, etc. Close the session before switching lessons or the learning language.

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4003 |
| Vanilla HTML | `vanilla/` | http://localhost:4003 |
| Next.js | `nextjs/` | http://localhost:4003 |
| React (Vite) | `react-vite/` | http://localhost:4003 |

**Read first in React/Next:** `TutorApp.tsx` — mount rules + close-before-switch.  
**Lesson IDs:** `lib/lessons.ts` (use `exp_01EXAMPLES_*`).

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
