# Spanish Tutor — spec

## Goal

Build a language-learning app where a learner practises Spanish with an animated AI tutor embedded via Liforma.

## User flow

1. User opens the app.
2. User sees a list of Spanish lessons.
3. User chooses a lesson (only when no session is active).
4. User starts practice.
5. The selected lesson's `experienceId` is passed to `<liforma-experience>`.
6. The experience session runs; surrounding UI shows the learning goal and session notes.
7. User ends the session (or closes the embed).
8. User may select a different lesson and start again.

## Lesson switching rule

**No mid-session lesson change.** While a session is active:

- Other lessons are disabled.
- UI explains the user must end the session first.
- Do not change `experience-id` on a running embed.

## Lessons (Phase 1)

Each lesson maps to its own Liforma Experience (scenario, location, and tutor prompt differ).

| ID | Title | Experience ID |
| --- | --- | --- |
| cafe-conversation | Café Conversation | `exp_01DEMO1SPANISHCAFE` |
| hotel-check-in | Hotel Check-in | `exp_01DEMO1SPANISHHOTEL` |
| asking-directions | Asking for Directions | `exp_01DEMO1SPANISHDIRECTIONS` |
| shopping-clothes | Shopping for Clothes | `exp_01DEMO1SPANISHSHOP` |

Each lesson includes: `id`, `title`, `description`, `level`, `goal`, `experienceId`.

## Required UI

- Lesson selection panel
- Selected lesson summary / learning goal card
- Liforma experience embed region
- Session status (idle / active)
- Start / End session controls
- Microphone permission note
- Session notes or transcript placeholder panel
- Loading and error states for SDK load
- Responsive layout (sidebar + workspace on desktop; stacked on mobile)

## Liforma integration

```html
<script src="https://cdn.liforma.ai/sdk/v2/client.js"></script>
<liforma-experience experience-id="EXP_ID_FROM_LESSON"></liforma-experience>
```

Listen for `close` on the custom element to return to idle.

## Experience IDs

Each lesson carries an `experienceId` pointing at a Liforma Experience tuned for that scenario. IDs are hard-coded in `lessons.ts` / `lessons.js` — the same field you'd populate from your database or CMS in production.

Do **not** put experience IDs in environment variables unless your deployment pipeline genuinely sources them that way.

## Adaptation instructions

Preserve: embed, lesson flow, close-before-switch, goal card, session status.

Adapt: branding, lesson content, experience IDs, transcript wiring, auth if needed.

## Acceptance criteria

- [ ] Four lessons selectable when idle
- [ ] Lessons disabled during active session
- [ ] Embed mounts only when session starts
- [ ] End session clears embed and re-enables lesson list
- [ ] SDK load loading + error UI
- [ ] Mobile-friendly layout
- [ ] No API keys in client code
- [ ] `npm run verify` passes (SvelteKit)
