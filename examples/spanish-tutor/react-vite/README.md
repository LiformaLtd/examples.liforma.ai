# Spanish Tutor (React + Vite)

Lesson-based Spanish practice with a Liforma `<Experience>` embed. Each lesson maps to its own `experienceId`.

```bash
npm install
npm run dev
```

Open http://localhost:4003

## Integration

| File | Role |
| --- | --- |
| `src/TutorApp.tsx` | **Start here.** Liforma mount, session state, close-before-switch rules |
| `src/lib/lessons.ts` | Static lesson list and `experienceId` values (`exp_01EXAMPLES_*`) |
| `src/components/LessonList.tsx` | Demo UI — lesson picker |
| `src/App.tsx` | Page shell (header + layout) |

Optional catalog loading is **not** included in this Vite demo — lessons ship as `fallbackLessons` in the client bundle. For a server-side catalog fetch, see the Next.js sibling at `../nextjs` (`lib/loadLessons.ts` with `LIFORMA_API_KEY`).

### Lesson → experienceId

Each row in `src/lib/lessons.ts` carries an `experienceId` for one Liforma Experience. In production you would load this mapping from your database, CMS, or a backend API route.

### Close-before-switch

While a session is active:

- Lesson buttons are disabled.
- `<Experience>` stays mounted with the **same** `experienceId`.
- The user must end the session (or close the embed) before choosing another lesson.

The embed is **not** mounted until the user taps **Start practice**. That way `experienceId` never changes on a live embed — we unmount on end, then mount again for the next lesson.

```tsx
// src/TutorApp.tsx — pattern to preserve
{sessionActive ? (
  <Experience experienceId={experienceId} language="es" onClose={handleEmbedClose} />
) : (
  <Placeholder />
)}
```

No API keys in client code.

Add `http://localhost:4003` to your project **allowed origins** in the Liforma developer portal.
