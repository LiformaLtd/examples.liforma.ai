# OpenAI Realtime embed (Next.js)

Next.js App Router coffee-barista embed with **OpenAI Realtime** as speech-to-speech.

## Files (for developers)

| File | What it is |
|---|---|
| **`@liforma/client/openai`** | **Read this first.** `connectOpenAiRealtime` — OpenAI Realtime → Liforma BYO helper. |
| `app/DemoApp.tsx` | Demo Connect / Start UI only. |
| `lib/config.ts` | Suggested Realtime instructions (barista). |
| `app/api/openai-realtime-session/route.ts` | Demo ephemeral client-secret mint — replace with your backend in production. |

```ts
import { connectOpenAiRealtime } from '@liforma/client/openai';

const bridge = await connectOpenAiRealtime(experience, {
  ephemeralKey,
  instructions: '…'
});
```

This example uses **WebSocket + ephemeral client secret** so turns match the ElevenLabs `createUtterance` pattern. For OpenAI’s preferred browser **WebRTC** path, see the [OpenAI BYO docs](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai).

## Run

```bash
cd examples/openai-realtime-embed/nextjs && npm install && npm run dev
```

Open **http://localhost:4007**

## Setup

1. Create an [OpenAI API key](https://platform.openai.com/api-keys) with Realtime access.
2. Optionally review the suggested **Instructions** on the page (applied at mint + `session.update`).
3. Paste the API key (or set `OPENAI_API_KEY`), click **Connect**, then tap **Start experience** on the avatar.
4. Allow microphone access when prompted (OpenAI owns the mic; Liforma `speechInputMode` is off).

Optional server-side key:

```bash
OPENAI_API_KEY=sk-… npm run dev
```

Then leave the API key field blank.

## Docs

- [OpenAI → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai)
