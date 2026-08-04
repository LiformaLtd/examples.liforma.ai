# Local Liforma stack (monorepo engineers)

Examples default to production (`cdn.liforma.ai`, `api.liforma.ai`, `player.liforma.ai`), including when the example itself runs on `localhost`. The SDK never switches to the monorepo stack from hostname alone — local is opt-in only via `LIFORMA_STACK` / `__LIFORMA_STACK` / `?stack=local` / `npm run dev:local`.

## `./start --local` (recommended)

From the examples repo (inside the monorepo):

```bash
./start --local
# or restart examples already running on production:
./start --local --restart
```

This:

1. Starts **api** (`:3001`), **player** (`:3002`), and **cdn** SDK preview (`:3010`) from the parent monorepo when not already running.
2. Starts gallery + examples on **4000**–**4004** with the local stack injected (`window.__LIFORMA_STACK = 'local'` for vanilla, `VITE_LIFORMA_STACK=local` for SvelteKit).

Check status:

```bash
./start --local --status
```

## Other overrides

| Mechanism | Use |
| --- | --- |
| `?stack=local` | Query param on any example URL |
| `npm run dev:local` | SvelteKit examples with local stack |
| `LIFORMA_STACK=local PORT=4003 node scripts/serve-example.mjs examples/guided-practice/vanilla` | Single vanilla example from repo root |

Local endpoints: API `:3001`, player `:3002`, CDN SDK preview `:3010`.

Shared stack helpers: `vanilla/shared/liformaStack.js` (copied per example).

## Meta repo guided practice (legacy port 3013)

The meta workspace `./start --only api,player,cdn,guided-practice` still serves guided practice on **3013** with local stack for monorepo-only workflows. Prefer `./start --local` in the examples repo on **4003** instead.

```bash
LIFORMA_STACK=local PORT=3013 node ../../../../scripts/serve-liforma-example.mjs
```

Bump `SDK_BUILD` in `sdk.js` after rebuilding the CDN bundle.
