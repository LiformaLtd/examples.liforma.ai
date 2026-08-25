# Programmatic publish (Node)

Local-only CLI that uses `@liforma/publisher` to upload images, create a location/place/clothes/hair/character, and publish an experience.

Reserved example port: **4011** (CLI only — no HTTP server).

## Setup

```bash
# From the Liforma meta workspace, build the unpublished package once:
(cd ../../../../api.liforma.ai/packages/publisher && npm run build)

cd examples/programmatic-publish/node
npm install
```

## Run

```bash
export LIFORMA_API_KEY=lfm_live_…
export LIFORMA_PROJECT_ID=proj_…
# optional: export LIFORMA_API_URL=http://localhost:3001

npm start -- --lobby ./lobby.png --clothes ./clothes.png --hair ./hair.png
```

Requires a live project API key on an authoring-enabled organization. Creates billable assets.
