# ElevenLabs embed (SvelteKit)

SvelteKit coffee-barista embed with **ElevenLabs Agents** as speech-to-speech.

## Files (for developers)

| File | What it is |
|---|---|
| **`@liforma/client/elevenlabs`** | **Read this first.** `connectElevenLabsAgent` — ElevenLabs → Liforma BYO helper. |
| `src/routes/+page.svelte` | Demo page shell only (Connect/End UI, arm-then-start flow, modal). |
| `src/lib/config.ts` | Suggested agent first message + system prompt (dashboard paste content). |
| `src/lib/demoSignedUrl.ts` | Client helper for the demo API route. |
| `src/routes/api/elevenlabs-signed-url/+server.ts` | Demo signed-URL proxy — replace with your backend in production. |

```ts
import { connectElevenLabsAgent } from '@liforma/client/elevenlabs';

const bridge = await connectElevenLabsAgent(experience, { signedUrl });
// … later
await bridge.end();
```

## Run

```bash
cd examples/elevenlabs-embed/sveltekit && npm install && npm run dev
```

Open **http://localhost:4006**

## Setup

1. Create an [ElevenLabs Agent](https://elevenlabs.io/app/agents).
2. On the example page, **Copy** the suggested **First message** and **System prompt** into the agent.
3. Create an API key (**Developers → API Keys**). Restricted keys need **ElevenAgents → Write**.
4. Paste Agent ID + API key, click **Connect**, then tap **Start experience** on the avatar.

Optional server-side key:

```bash
ELEVENLABS_API_KEY=sk_… npm run dev
```

## Docs

- [ElevenLabs → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs)
