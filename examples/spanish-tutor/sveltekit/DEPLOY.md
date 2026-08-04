# Deploy Spanish Tutor (SvelteKit) on Vercel

Production URL: **https://spanish-tutor.examples.liforma.ai**

This app is a **separate Vercel project** from the main `examples.liforma.ai` gallery. Root directory for the project must be this folder (`examples/spanish-tutor/sveltekit`).

## Prerequisites

1. `api.liforma.ai` deployed with platform seed (`npm run db:seed` in `api.liforma.ai`)
2. Spanish Tutor project origins seeded (includes this hostname) — see `api.liforma.ai/src/lib/server/platform/seedPlatform.ts`
3. Public experience ids (used by lessons):
   - `exp_01DEMO1SPANISHCAFE`
   - `exp_01DEMO1SPANISHHOTEL`
   - `exp_01DEMO1SPANISHDIRECTIONS`
   - `exp_01DEMO1SPANISHSHOP`

## Vercel setup

```sh
cd examples/spanish-tutor/sveltekit
npm install
npx vercel link
```

| Setting | Value |
| --- | --- |
| Root directory | `examples/spanish-tutor/sveltekit` (when linking from `examples.liforma.ai` repo) |
| Framework | SvelteKit |
| Build | `npm run build` |

### Domain

Add custom domain: `spanish-tutor.examples.liforma.ai`

### Environment variables

| Variable | When to set |
| --- | --- |
| `LIFORMA_API_KEY` | **Recommended** — loads published lessons from `GET /v1/projects/{projectId}/experiences` |
| `LIFORMA_PROJECT_ID` | Optional — defaults to `seed_proj_examples` |
| `LIFORMA_API_URL` | Staging API only |
| `PUBLIC_API_BASE_URL` | Override SDK API base for session mint (staging only) |

Without `LIFORMA_API_KEY`, the app falls back to static lessons in `src/lib/lessons.ts`.

The vanilla example fetches the same lesson list from `GET /api/lessons` on this app (no API key in the browser).

## Deploy

```sh
git push origin main
```

Or:

```sh
npx vercel deploy --prod
```

## Verify

1. Open https://spanish-tutor.examples.liforma.ai
2. Start **Café Conversation** — avatar loads and accepts microphone
3. If CORS / origin errors: confirm origin is on Spanish Tutor project in [app.liforma.ai](https://app.liforma.ai) → Allowed origins, or re-run API seed

## Local dev

```sh
npm run dev
```

Runs on http://localhost:4002 (`strictPort: true`). Origins `http://localhost:4002` and `http://localhost:4000` are seeded on the Spanish Tutor project.
