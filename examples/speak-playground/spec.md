# Speak playground — spec

## Goal

Demonstrate `experience.speech.speak({ queue })` with a simple text field: user types a line, presses Enter, and the experience speaks it. A visible toggle switches between enqueue (`queue: 'append'`) and interrupt (`queue: 'replace-active'`) so integrators can see the difference when firing multiple lines quickly.

## User flow

1. Page loads SDK and attaches a presenter session (`speechInputMode: off` — no microphone).
2. User taps the player-owned **Start experience** button (audio unlock).
3. User selects **Enqueue** or **Interrupt**.
4. User types in the text field and presses **Enter** (or taps Speak).
5. Experience speaks the line. Log shows the behavior used and completion or interruption.
6. Optional: **Fire 3 lines quickly** sends three `speak()` calls without waiting — enqueue plays in order; interrupt cuts each previous line.

## Liforma integration

```tsx
import { Experience, type ExperienceHandle } from '@liforma/client/react';

// Declarative mount (React / Next) — or startSession + attach in vanilla
<Experience
  ref={experienceRef}
  experienceId="exp_…"
  mode="presenter"
  speechInputMode="off"
/>

await experienceRef.current.speech.speak({
  text: 'Hello!',
  queue: 'append' // or 'replace-active' to interrupt
});
```

## Required UI

- Experience embed (`Experience.attach`)
- Player-owned start control
- Text input + Enter to speak
- Enqueue / Interrupt toggle (visible, labeled)
- Optional burst demo button
- Session log (speak calls, completions, interruptions)

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA` (Examples project coffee barista clone).

## Frameworks

**Vanilla**, **SvelteKit**, **Next.js**, and **React (Vite)** — same UX; React/Next use `speech.speak({ queue })`.

## Local port

`4005` (all frameworks share the port; run one at a time).
