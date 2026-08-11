# examples.liforma.ai

Production-quality Liforma example apps for developers and AI builders.

Examples use the hosted Liforma platform (`cdn.liforma.ai`, `api.liforma.ai`, `player.liforma.ai`). You do **not** need to run Liforma's servers locally.

## Quick start (recommended)

Clone the repo, install dependencies, and start everything:

```bash
git clone https://github.com/LiformaLtd/examples.liforma.ai.git
cd examples.liforma.ai
npm install
./start
```

`./start` opens:

| Service | URL |
| --- | --- |
| Gallery (browse examples, copy prompts) | http://localhost:4000 |
| Basic embed (vanilla) | http://localhost:4001 |
| Experience widget (vanilla or SvelteKit) | http://localhost:4002 |
| Spanish Tutor (vanilla) | http://localhost:4003 |
| Guided practice — Speak API (vanilla) | http://localhost:4004 |
| Speak playground — enqueue vs interrupt (vanilla) | http://localhost:4005 |
| ElevenLabs embed — Agents → avatar (vanilla) | http://localhost:4006 |
| OpenAI Realtime embed — Realtime → avatar (vanilla) | http://localhost:4007 |
| Deepgram Voice Agent embed — Agent → avatar (vanilla) | http://localhost:4008 |
| LiveKit embed — Agent → avatar (vanilla) | http://localhost:4009 |
| Gemini Live embed — Agent → avatar (vanilla) | http://localhost:4010 |

To run SvelteKit implementations instead of vanilla:

```bash
./start sveltekit
```

That starts the gallery on **4000**, basic embed on **4001**, experience widget on **4002**, Spanish Tutor on **4003**, guided practice on **4004**, speak playground on **4005**, ElevenLabs embed on **4006**, OpenAI Realtime embed on **4007**, Deepgram Voice Agent embed on **4008**, LiveKit embed on **4009**, and Gemini Live embed on **4010**.

Next.js / React (Vite) modes start the gallery plus every example on its canonical port (**4001**–**4010**):

```bash
./start nextjs
./start react-vite
```

Other useful commands:

```bash
./start --status   # which ports are listening
./stop             # stop gallery + all examples
./stop basic-embed     # stop one service
./stop experience-widget
./stop spanish-tutor
```

## Run one example only

From the repo root you can still use `./start` (it skips services already running). Or `cd` into a single example and run it yourself:

**Basic embed (vanilla)** — port 4001:

```bash
PORT=4001 node scripts/serve-example.mjs examples/basic-embed/vanilla
```

**Basic embed (SvelteKit)** — port 4001:

```bash
cd examples/basic-embed/sveltekit
npm install
npm run dev
```

**Basic embed (Next.js)** — port 4001:

```bash
cd examples/basic-embed/nextjs
npm install
npm run dev
```

**Basic embed (React + Vite)** — port 4001:

```bash
cd examples/basic-embed/react-vite
npm install
npm run dev
```

**Experience widget (vanilla)** — port 4002:

```bash
PORT=4002 node scripts/serve-example.mjs examples/experience-widget/vanilla
```

**Experience widget (SvelteKit)** — port 4002:

```bash
cd examples/experience-widget/sveltekit
npm install
npm run dev
```

**Spanish Tutor (vanilla)** — port 4003:

```bash
cd examples/spanish-tutor/vanilla
npx serve . -l tcp://localhost:4003
```

**Spanish Tutor (SvelteKit)** — port 4003:

```bash
cd examples/spanish-tutor/sveltekit
npm install
npm run dev
```

**Guided practice (vanilla)** — port 4004:

```bash
cd examples/guided-practice/vanilla
npx serve . -l tcp://localhost:4004
```

**Speak playground (vanilla)** — port 4005:

```bash
PORT=4005 node scripts/serve-example.mjs examples/speak-playground/vanilla
```

**Speak playground (SvelteKit)** — port 4005:

```bash
cd examples/speak-playground/sveltekit
npm install
npm run dev
```

**ElevenLabs embed (vanilla)** — port 4006:

```bash
PORT=4006 node examples/elevenlabs-embed/vanilla/server.mjs
```

**OpenAI Realtime embed (vanilla)** — port 4007:

```bash
PORT=4007 node examples/openai-realtime-embed/vanilla/server.mjs
```

**Deepgram Voice Agent embed (vanilla)** — port 4008:

```bash
cd examples/deepgram-embed && npm install
cd vanilla && PORT=4008 node server.mjs

**LiveKit embed (vanilla)** — port 4009:

```bash
cd examples/livekit-embed && npm install
cd vanilla && npm install
LIVEKIT_URL=wss://… LIVEKIT_API_KEY=… LIVEKIT_API_SECRET=… PORT=4009 node server.mjs
```

**Gemini Live embed (vanilla)** — port 4010:

```bash
cd examples/gemini-live-embed && npm install
cd vanilla && PORT=4010 node server.mjs
```
```

Use **http://localhost:** ports (not a LAN IP) so WebGPU and microphone APIs work in the browser.

## Allowed origins

Public mint and embeds require your browser `Origin` on the project allowlist in the
[developer portal](https://app.liforma.ai) → your project → **Origins**.

Add the localhost ports you run locally (for example `http://localhost:4001`) and any
hosted demo origins (for example `https://….examples.liforma.ai`). The API does not
ship a hardcoded localhost allowlist.

## Verification

```bash
npm run verify
cd examples/basic-embed/sveltekit && npm run verify
cd examples/guided-practice/sveltekit && npm run verify
cd examples/speak-playground/sveltekit && npm run verify
```

## Liforma engineers (local stack override)

Third-party integrators should stay on production APIs. If you work in the Liforma monorepo:

```bash
./start --local              # api :3001, player :3002, cdn :3010 + examples on local stack
./start --local --restart    # rebind examples already running on production
```

See [`LOCAL_DEV.md`](LOCAL_DEV.md) for details and manual overrides.

## Links

- [Gallery (production)](https://examples.liforma.ai)
- [Spanish Tutor live demo](https://spanish-tutor.examples.liforma.ai/)
- [Docs: Quick Start](https://docs.liforma.ai/getting-started/quick-start)
- [GitHub](https://github.com/LiformaLtd/examples.liforma.ai)

<!-- deploy verify: git reconnect probe, 2026-07-31 -->
