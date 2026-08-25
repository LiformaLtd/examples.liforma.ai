# Programmatic publish (Node) — alpha

Unlisted local-only CLI for `@liforma/publisher`. Not part of the public examples gallery, `./start`, or hosted demos.

Path: `_alpha/examples/programmatic-publish/node`  
Reserved port: **4011** (CLI only — no HTTP server).

## Setup

```bash
# From the Liforma meta workspace, build the unpublished package once:
(cd ../../../../../api.liforma.ai/packages/publisher && npm run build)

cd _alpha/examples/programmatic-publish/node
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
