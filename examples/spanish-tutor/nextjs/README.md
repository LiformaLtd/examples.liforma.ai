# Spanish Tutor (Next.js)

Lesson-based Spanish practice with a Liforma `<Experience>` embed. Each lesson maps to its own `experienceId`.

```bash
npm install
npm run dev
```

Open http://localhost:4003

## Integration

| File | Role |
| --- | --- |
| `app/TutorApp.tsx` | **Start here.** Liforma mount, session state, close-before-switch rules |
| `lib/lessons.ts` | Static lesson list and `experienceId` values (`exp_01EXAMPLES_*`) |
| `lib/loadLessons.ts` | Server-side catalog loader (optional) |
| `lib/liformaCatalog.ts` | Authenticated project catalog API client |
| `components/LessonList.tsx` | Demo UI — lesson picker |

### Lesson → experienceId

Each row in `lib/lessons.ts` carries an `experienceId` for one Liforma Experience. In production you would load this mapping from your database or CMS. This demo also supports loading published experiences from your Liforma project catalog when server env vars are set (see below).

### Close-before-switch

While a session is active:

- Lesson buttons are disabled.
- `<Experience>` stays mounted with the **same** `experienceId`.
- The user must end the session (or close the embed) before choosing another lesson.

The embed is **not** mounted until the user taps **Start practice**. That way `experienceId` never changes on a live embed — we unmount on end, then mount again for the next lesson.

```tsx
// app/TutorApp.tsx — pattern to preserve
{sessionActive ? (
  <Experience experienceId={experienceId} learningLocale={learningLocale} onClose={handleEmbedClose} />
) : (
  <Placeholder />
)}
```

No API keys in client code. Optional catalog fetch uses `LIFORMA_API_KEY` on the server only.

## Optional catalog (server)

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `LIFORMA_API_KEY` | Bearer token for `GET /v1/projects/{id}/experiences` |
| `LIFORMA_PROJECT_ID` | Project id (default `seed_proj_examples`) |
| `LIFORMA_API_URL` | API base (default `https://api.liforma.ai`) |

Without `LIFORMA_API_KEY`, lessons come from `fallbackLessons` in `lib/lessons.ts`.

Add `http://localhost:4003` to your project **allowed origins** in the Liforma developer portal.
