# LiveKit embed — React (Vite)

**Copy into your product:** `src/lib/helloByo.ts` (`startByoSpeech`). `src/DemoApp.tsx` is scaffolding only.

```bash
cd examples/livekit-embed && npm install
cd react-vite && npm install
export LIVEKIT_URL=wss://…
export LIVEKIT_API_KEY=…
export LIVEKIT_API_SECRET=…
npm run dev
```

Open http://localhost:4009

The demo API is served on the **same port** by Vite middleware (`POST /api/livekit-token`). Secrets stay server-side.

```ts
import { startByoSpeech } from './helloByo';

const bridge = await startByoSpeech(experience, { url, token });
```

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
