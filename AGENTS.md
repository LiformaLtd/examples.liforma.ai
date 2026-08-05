# AGENTS.md — examples.liforma.ai

When working in this repository:

0. **Prefer Liforma Agent Skills** before inventing integration code:
   `npx skills add LiformaLtd/agent-skills`
   ([LiformaLtd/agent-skills](https://github.com/LiformaLtd/agent-skills) — `liforma-integrate`, `liforma-debug`).
   Docs index: https://docs.liforma.ai/llms.txt
1. Keep examples minimal but complete.
2. Use TypeScript in SvelteKit apps.
3. Use normal CSS, not Tailwind.
4. Each example must be buildable and deployable.
5. Prefer framework-native patterns.
6. Do not hide the Liforma integration behind unnecessary abstraction.
7. Include loading, error, microphone permission, and mobile states where relevant.
8. Store Liforma `experienceId` values on lesson/app data (or your API), not in `.env`, unless your deployment genuinely sources them that way.
9. Keep `spec.md` files accurate and useful for AI app builders.
10. Do not include real API keys or secrets.
11. Every example should be useful as source material for AI coding agents.

## Gallery site

- Port **4000**, `strictPort: true`
- `./start` runs gallery + runnable examples (see root `README.md`)
- Metadata in `src/lib/examples.ts` and `src/lib/frameworks.ts`
- Only mark frameworks `available: true` when source exists in the repo

## Spanish Tutor pattern

The app chooses a lesson; the lesson chooses the Liforma Experience (`selectedLesson.experienceId` → `<liforma-experience>`).

Users must **close the active session** before switching lessons.

## Build order for new work

1. Runnable example app(s)
2. Gallery pages and metadata
3. `npm run verify` at repo root and in nested apps
