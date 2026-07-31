# examples.liforma.ai

Production-quality Liforma example apps for developers and AI builders.

Examples use the hosted Liforma platform (`cdn.liforma.ai`, `api.liforma.ai`, `player.liforma.ai`). You do **not** need to run Liforma's servers locally.

## Quick start (recommended)

Clone the repo, install dependencies, and start everything:

```bash
git clone https://github.com/charlesatliforma/examples.liforma.ai.git
cd examples.liforma.ai
npm install
./start
```

`./start` opens:

| Service | URL |
| --- | --- |
| Gallery (browse examples, copy prompts) | http://localhost:4000 |
| Spanish Tutor (vanilla) | http://localhost:4001 |
| Guided practice — Speak API (vanilla) | http://localhost:4002 |

To run SvelteKit implementations instead of vanilla:

```bash
./start sveltekit
```

That starts the gallery on **4000** and Spanish Tutor SvelteKit on **4001** (guided practice is vanilla-only today).

Other useful commands:

```bash
./start --status   # which ports are listening
./stop             # stop gallery + all examples
./stop spanish-tutor   # stop one service
```

## Run one example only

From the repo root you can still use `./start` (it skips services already running). Or `cd` into a single example and run it yourself:

**Spanish Tutor (vanilla)** — port 4001:

```bash
cd examples/spanish-tutor/vanilla
npx serve . -l tcp://localhost:4001
```

**Spanish Tutor (SvelteKit)** — port 4001:

```bash
cd examples/spanish-tutor/sveltekit
npm install
npm run dev
```

**Guided practice (vanilla)** — port 4002:

```bash
cd examples/guided-practice/vanilla
npx serve . -l tcp://localhost:4002
```

Use **http://localhost:** ports (not a LAN IP) so WebGPU and microphone APIs work in the browser.

## Allowlisted origins

Public mint and embeds require your browser `Origin` on the project allowlist. Liforma demo experiences include:

- `http://localhost:4000`–`http://localhost:4002` (gallery + examples)
- Hosted demos on `*.examples.liforma.ai`

For your own `exp_…` experiences, add the same origins in [app.liforma.ai](https://app.liforma.ai) → your project → **Origins**.

## Verification

```bash
npm run verify
cd examples/guided-practice/sveltekit && npm run verify
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
- [GitHub](https://github.com/charlesatliforma/examples.liforma.ai)
