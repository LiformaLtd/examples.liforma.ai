# Spanish Tutor — SvelteKit

## Run

```bash
npm install
npm run dev
```

http://localhost:3007

**Local avatar embed** also needs API and player running (v2 SDK loads from production CDN):

```bash
# From workspace root (liforma/)
cd api.liforma.ai && npm run dev      # :3001
cd player.liforma.ai && npm run dev    # :3002
```

Optional: `cd cdn.liforma.ai && npm run dev` (`:3010`) only when testing unpublished SDK changes.

## Verify

```bash
npm run verify
```

## Customise

- `src/lib/loadLessons.ts` — fetches `GET /v1/projects/{projectId}/experiences` server-side
- `src/lib/lessons.ts` — static fallback lesson copy keyed by slug
- `src/routes/+page.svelte` — main lesson UI
- `src/lib/components/LiformaEmbed.svelte` — SDK + web component

Set `LIFORMA_API_KEY` (see `.env.example`) to load lessons from your Liforma project catalog. Without it, the app uses the static fallback list in `lessons.ts`.
