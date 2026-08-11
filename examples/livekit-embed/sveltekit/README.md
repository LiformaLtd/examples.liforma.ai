# LiveKit embed — SvelteKit

Coffee-barista embed with LiveKit BYO voice via `helloByo.ts` → `connectLiveKitAgent`.

**Copy into your product:** `src/lib/helloByo.ts` (`startByoSpeech`). `+page.svelte` is scaffolding only.

```bash
cd examples/livekit-embed && npm install
cd sveltekit && npm install
export LIVEKIT_URL=wss://…
export LIVEKIT_API_KEY=…
export LIVEKIT_API_SECRET=…
npm run dev
```

Open http://localhost:4009

| Path | Role |
| --- | --- |
| **`src/lib/helloByo.ts`** | **Copy this.** Thin `startByoSpeech` → `connectLiveKitAgent` |
| `src/routes/+page.svelte` | Demo scaffolding only (Connect / Start UI) |
| `src/routes/api/livekit-token/+server.ts` | Demo token mint — replace in production |

```ts
import { startByoSpeech } from './helloByo';

const bridge = await startByoSpeech(experience, { url, token });
```

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
