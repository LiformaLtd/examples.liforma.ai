# ElevenLabs embed (Next.js)

Next.js App Router coffee-barista embed with **ElevenLabs Agents** as speech-to-speech.

## Files (for developers)

| File | What it is |
|---|---|
| **`@liforma/client/elevenlabs`** | **Read this first.** `connectElevenLabsAgent` — ElevenLabs → Liforma BYO helper. |
| `app/DemoApp.tsx` | Demo Connect / Start UI only. |
| `app/api/elevenlabs-signed-url/route.ts` | Demo secret mint — replace in production. |

```ts
import { connectElevenLabsAgent } from '@liforma/client/elevenlabs';

const bridge = await connectElevenLabsAgent(experience, { signedUrl });
```

## Run

```bash
cd examples/elevenlabs-embed/nextjs && npm install && npm run dev
```

Open **http://localhost:4006**

## Docs

- [ElevenLabs → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs)
