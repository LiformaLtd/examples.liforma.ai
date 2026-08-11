# Hosted demos (`*.examples.liforma.ai`)

Each curated example has a SvelteKit deploy at:

```text
https://{slug}.examples.liforma.ai/
```

Plan: `docs/plans/2026/08/hosted-examples-demos.plan.md` (meta repo).

## Modes

| Mode | Slugs | Behaviour |
|------|-------|-----------|
| **Live** | basic-embed, experience-widget, spanish-tutor, guided-practice, speak-playground, elevenlabs-embed, openai-realtime-embed, livekit-embed | Full demo on Vercel |
| **Local-only notice** | deepgram-embed, gemini-live-embed | Hosted page shows clone/run instructions (needs WS proxy) |

## SDK dependency

Hosted builds use **npm** `@liforma/client` (`^0.4.0+`, includes BYO subpaths).

For unpublished monorepo SDK work:

```bash
cd ../cdn.liforma.ai && npm run build && npm link
cd examples/<slug>/sveltekit && npm link @liforma/client
```

## Provision Vercel projects

```bash
export VERCEL_TOKEN=…          # https://vercel.com/account/tokens
export VERCEL_TEAM_ID=team_uYCi0RTUn1ajWWcM8edZT2BT
node scripts/provision-hosted-demos.mjs
```

Then in each new project (or via first `npx vercel link` from `examples/<slug>/sveltekit`):

| Setting | Value |
|---------|--------|
| Root Directory | `examples/{slug}/sveltekit` |
| Framework | SvelteKit |
| Production domain | `{slug}.examples.liforma.ai` |

### Env secrets (live BYO)

| Project | Variables |
|---------|-----------|
| elevenlabs-embed | `ELEVENLABS_API_KEY` (+ agent config as used by the demo) |
| openai-realtime-embed | `OPENAI_API_KEY` |
| livekit-embed | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` |
| spanish-tutor | `LIFORMA_API_KEY` (optional catalog) |

## DNS

Prefer wildcard:

```text
*.examples.liforma.ai → Vercel
```

Spanish Tutor already proves the zone works for nested hosts.

## Gallery

`src/lib/examples.ts` sets `liveAppUrl` + `liveDemoMode` for every slug. Cards label **Live demo** or **Hosted notice**.
