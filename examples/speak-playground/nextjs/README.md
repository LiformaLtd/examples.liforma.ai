# Speak playground (Next.js)

Type text and hear the experience speak it via `speech.speak({ queue })`. Toggle **Enqueue** vs **Interrupt** to see how queue mode affects playback when you send several lines quickly.

## Integration

```tsx
'use client';

import { useRef } from 'react';
import { Experience, type ExperienceHandle } from '@liforma/client/react';

const experienceRef = useRef<ExperienceHandle | null>(null);

<Experience
  ref={experienceRef}
  experienceId="exp_01EXAMPLES_COFFEE_BARISTA"
  mode="presenter"
  speechInputMode="off"
  startButton={{ label: 'Start experience', ... }}
  onStarted={() => setReady(true)}
/>;

// After session start:
experienceRef.current?.speech.speak({
  text: 'Hello there!',
  queue: interrupt ? 'replace-active' : 'append',
});
```

- **Enqueue** → `queue: 'append'` (waits for the current line to finish).
- **Interrupt** → `queue: 'replace-active'` (stops active speech and clears the queue).
- An `AbortError` on the speak promise means the utterance was interrupted.

Import from `@liforma/client/react` (not `/next`). See `app/SpeakWorkspace.tsx` for the full playground UI.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:4005
