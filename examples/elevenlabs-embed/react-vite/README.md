# ElevenLabs embed (React + Vite)

React (Vite) coffee-barista embed with **ElevenLabs Agents** as speech-to-speech.

## Files (for developers)

| File | What it is |
|---|---|
| **`@liforma/client/elevenlabs`** | **Read this first.** `connectElevenLabsAgent` — ElevenLabs → Liforma BYO helper. |
| `src/DemoApp.tsx` | Demo Connect / Start UI only. |
| `server/api-handlers.mjs` + Vite middleware | Demo secret mint — replace in production. |

```ts
import { connectElevenLabsAgent } from '@liforma/client/elevenlabs';

const bridge = await connectElevenLabsAgent(experience, { signedUrl });
```

## Run

```bash
cd examples/elevenlabs-embed/react-vite && npm install && npm run dev
```

Open **http://localhost:4006**

## Docs

- [ElevenLabs → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs)
