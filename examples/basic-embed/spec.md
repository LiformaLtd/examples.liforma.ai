# Basic embed — spec

## Goal

The hello-world Liforma integration: mount a single experience with no host-side speech UI, lesson chrome, or custom turn logic.

## User flow

1. Page loads and mounts `<Experience experienceId="…" />` (Svelte) or `<liforma-experience>` (vanilla).
2. SDK mints a public session and attaches the hosted player.
3. User taps the player-owned start control and talks with the experience.

## Liforma integration

### SvelteKit

```svelte
<script>
  import { Experience } from '@liforma/client/svelte';
</script>

<Experience experienceId="exp_01EXAMPLES_COFFEE_BARISTA" />
```

### Vanilla

```html
<script src="https://cdn.liforma.ai/sdk/v2/client.js"></script>
<liforma-experience experience-id="exp_01EXAMPLES_COFFEE_BARISTA"></liforma-experience>
```

## Required UI

- Full-viewport (or clearly sized) experience host
- No custom speak / listen controls — conversation mode uses the player defaults

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA` (Examples project coffee barista).

## Frameworks

**Vanilla** (`vanilla/`) and **SvelteKit** (`sveltekit/`) — same experience and UX.

## Local port

`4001` (vanilla and SvelteKit share the port).
