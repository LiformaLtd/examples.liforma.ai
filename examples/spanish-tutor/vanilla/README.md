# Spanish Tutor — Vanilla HTML

Minimal copy-paste example using the Liforma CDN web component.

## Run

```bash
npx serve . -l 3008
```

http://localhost:3008

## Files

- `index.html` — structure + CDN script tag
- `lessons.js` — static fallback lesson data
- `lessonsLoader.js` — fetches lessons from the SvelteKit `/api/lessons` endpoint
- `app.js` — UI state, close-before-switch, embed mount
- `styles.css` — layout (no build step)

## Run with catalog

Start the SvelteKit app on port 3007 with `LIFORMA_API_KEY` set, then serve vanilla on 3008:

```bash
# terminal 1
cd ../sveltekit && LIFORMA_API_KEY=lfm_test_… npm run dev

# terminal 2
npx serve . -l 3008
```

Vanilla loads lessons from `http://localhost:3007/api/lessons` automatically when served on port 3008.

## Customise

Publish experiences in Studio for your project. Optional slug-specific copy still lives in the SvelteKit `lessonDetailsBySlug` map. Each lesson's `experienceId` is passed to `<liforma-experience>` when practice starts.
