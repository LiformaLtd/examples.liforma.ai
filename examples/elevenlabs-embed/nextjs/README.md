# ElevenLabs embed (Next.js)

Next.js App Router coffee-barista embed with **ElevenLabs Agents** as speech-to-speech.

## Files (for developers)

| File | What it is |
|---|---|
| **`lib/helloByo.ts`** | **Copy this into your product.** Thin `startByoSpeech` → `connectElevenLabsAgent`. |
| **`@liforma/client/elevenlabs`** | SDK helper called only from `helloByo.ts`. |
| `app/DemoApp.tsx` | Demo scaffolding only (Connect / Start UI). |
| `app/api/elevenlabs-signed-url/route.ts` | Demo secret mint — replace in production. |

```ts
import { startByoSpeech } from './helloByo';

const bridge = await startByoSpeech(experience, { signedUrl });
```

## Run

```bash
cd examples/elevenlabs-embed/nextjs && npm install && npm run dev
```

Open **http://localhost:4006**

## Docs

- [ElevenLabs → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs)
