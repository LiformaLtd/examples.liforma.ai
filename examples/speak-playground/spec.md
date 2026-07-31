# Speak playground — spec

## Goal

Demonstrate `Experience.speak()` with a simple text field: user types a line, presses Enter, and the avatar speaks it. A visible toggle switches `behavior` between `enqueue` and `interrupt` so integrators can see the difference when firing multiple lines quickly.

## User flow

1. Page loads SDK and attaches a presenter session (`speechInputMode: off` — no microphone).
2. User taps the player-owned **Start avatar** button (audio unlock).
3. User selects **Enqueue** or **Interrupt**.
4. User types in the text field and presses **Enter** (or taps Speak).
5. Avatar speaks the line. Log shows the behavior used and completion or interruption.
6. Optional: **Fire 3 lines quickly** sends three `speak()` calls without waiting — enqueue plays in order; interrupt cuts each previous line.

## Liforma integration

```js
const experience = await Experience.startSession({
  experienceId: 'exp_…',
  mode: 'presenter',
  speechInputMode: 'off'
});

experience.on('started', () => {
  void experience.speak({ text: 'Hello!', behavior: 'enqueue' });
});

await experience.attach({ container });
```

## Required UI

- Avatar embed (`Experience.attach`)
- Player-owned start control
- Text input + Enter to speak
- Enqueue / Interrupt toggle (visible, labeled)
- Optional burst demo button
- Session log (speak calls, completions, interruptions)

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA` (Examples project coffee barista clone).

## Frameworks

**Vanilla** (`vanilla/`) and **SvelteKit** (`sveltekit/`) — same UX and API calls.

## Local port

`4003` (vanilla and SvelteKit share the port).
