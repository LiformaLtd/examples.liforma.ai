# Experience widget — spec

## Goal

Demo `<liforma-experience-widget>` / `ExperienceWidget` as a bottom-right site launcher on a simple marketing-style page. Collapsed state is thumb-only (plates fetched from the public preview API); click expands an in-page experience overlay.

## User flow

1. Page loads with headline copy and a corner widget (`experience-id` only — no gallery-thumb JSON).
2. Widget fetches `GET /v1/experiences/{id}/preview` and paints plates (no session mint yet).
3. User clicks the widget → overlay expands → player loads → **Tap to talk** unlocks audio.
4. User closes → overlay dismisses; widget returns to collapsed thumb.

## Liforma integration

### Vanilla

```html
<script src="https://cdn.liforma.ai/sdk/v2/client.js"></script>

<liforma-experience-widget
  experience-id="exp_01EXAMPLES_COFFEE_BARISTA"
  alt="Talk to our barista"
  position="bottom-right"
  offset="16"
  prefetch="idle"
></liforma-experience-widget>
```

Default `position` is `static` (fill the host). Use `bottom-right` / `bottom-left` for a self-positioned FAB. Default `prefetch` is `onExpand`; this demo uses `idle` for one-gesture expand. Optional `gallery-thumb` overrides the preview fetch when the host already has catalog URLs.

## Experience

`exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla** (`vanilla/`) for v1.

## Local port

`4002` (Spanish Tutor → `4003`, guided-practice → `4004`, speak-playground → `4005`).
