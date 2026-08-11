# Local Liforma stack (monorepo engineers)

Examples always target production (`cdn.liforma.ai`, `api.liforma.ai`, `player.liforma.ai`), including when the example itself runs on `localhost`. Sample app code never configures a local stack — that keeps third-party copy-paste demos unambiguous.

**SDK dependency:** example `package.json` files use npm `@liforma/client` (`^0.4.0+`) so Vercel / third-party clones work without the meta monorepo. For unpublished SDK changes:

```bash
cd ../cdn.liforma.ai && npm run build && npm link
cd examples/<slug>/sveltekit && npm link @liforma/client
```

Hosted demos: see [`HOSTED.md`](./HOSTED.md).

Local opt-in (no example-app helpers):

- Append `?stack=local` to the host page URL (SDK reads it on the parent page)
- Or use **repo tooling** (`./start --local`, `scripts/serve-example.mjs`, `scripts/dev-with-local-stack.mjs`), which sets `window.__LIFORMA_STACK = 'local'`

## `./start --local` (recommended)

From the examples repo (inside the monorepo):

```bash
./start --local
# or restart examples already running on production:
./start --local --restart
```

This:

1. Starts **api** (`:3001`), **player** (`:3002`), and **cdn** SDK preview (`:3010`) from the parent monorepo when not already running.
2. Starts gallery + examples on **4000**–**4008** with the local stack injected via repo scripts (not example source).

Check status:

```bash
./start --local --status
```

## Other overrides (engineers)

| Mechanism | Use |
| --- | --- |
| `?stack=local` on the example URL | SDK host-page opt-in (any framework) |
| `LIFORMA_STACK=local PORT=4004 node scripts/serve-example.mjs examples/guided-practice/vanilla` | Single vanilla example |
| `node ../../../../scripts/dev-with-local-stack.mjs` | From a SvelteKit / React-Vite example dir |
| DevTools: `window.__LIFORMA_STACK = 'local'` then reload | Ad-hoc debugging |

Local endpoints: API `:3001`, player `:3002`, CDN SDK preview `:3010`.

`LIFORMA_STACK=local` also rewrites `https://cdn.liforma.ai/sdk/v2/client.js` → `http://localhost:3010/sdk/v2/client.js` in served HTML so unpublished SDK features (e.g. ExperienceWidget) load from the local CDN preview. Appending `?stack=local` alone is **not** enough for that — the page would still load production `client.js`.

## Meta repo guided practice (legacy port 3013)

The meta workspace `./start --only api,player,cdn,guided-practice` still serves guided practice on **3013** with local stack for monorepo-only workflows. Prefer `./start --local` in the examples repo on **4004** instead.

```bash
LIFORMA_STACK=local PORT=3013 node ../../../../scripts/serve-liforma-example.mjs
```
