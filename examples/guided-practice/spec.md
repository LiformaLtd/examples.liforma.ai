# Guided practice — spec

## Goal

Demonstrate **scripted practice** (Marvely-style): the experience speaks predetermined lines via `Experience.speak()`, while learner speech is captured with explicit Start/Stop boundaries and analysed by the host app — not by the experience LLM.

## User flow

1. Page loads SDK and attaches a presenter/manual session.
2. User taps the player-owned **Begin lesson** button, which unlocks audio and emits `started`.
3. For each turn:
   - User taps **Play tutor line** → `speak({ text })`.
   - User taps **Start** → `startListening()`.
   - User speaks, then taps **Stop** → `stopListening()`.
   - Host shows feedback (local mock analyser).
   - User taps **Next** → next canned line.
4. After all turns, practice is complete.

## Liforma integration

```js
const experience = await Experience.startSession({
  experienceId: 'exp_01EXAMPLES_COFFEE_BARISTA',
  mode: 'presenter',
  speechInputMode: 'manual',
  startButton: {
    label: 'Begin lesson',
    placement: 'bottom-center'
  },
  onUserTranscript: (update) => { /* optional */ }
});

experience.on('started', async () => {
  await experience.speak({ text: 'Welcome! What would you like?' });
});
await experience.attach({ container });
await experience.startListening();
const utterance = await experience.stopListening();
// utterance.text → host feedback API (not speak())
```

## Required UI

- Experience embed region (`Experience.attach`)
- Player-owned Begin lesson control
- Play line / Start / Stop / Next controls with disabled states per phase
- Turn hint card
- Host feedback panel (not in experience conversation history)
- Session log

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA` (Examples project coffee barista clone). Presenter mode does not require an opening message in the experience definition.

## Frameworks

**Vanilla** (`vanilla/`) and **SvelteKit** (`sveltekit/`) — same Experience API calls and turn flow.
