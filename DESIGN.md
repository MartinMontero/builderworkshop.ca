# DESIGN.md — builderworkshop.ca

Per the Design Field Manual: this file outranks the manual inside this repo.

## Per-project binding (manual §9)

| Field | Value |
|---|---|
| Brand seed colour | Canada flag red `#d52b1e` |
| Glass surface allocation | Sticky nav backdrop (scrolled state) — the one allocation; a second is unused |
| Component set delta | Adds: map marker / pill / ticket-stub card. Omits: dialog, snackbar, input (no forms) |
| Dependency policy | MIT code, CC BY 4.0 data; no new runtime services beyond OpenStreetMap tiles |
| Merge gates | Reviewer-enforced §8.8 (no CI yet) |
| Out of scope | Webfont body text, FAB, shape-morph libs, dynamic colour from user context, WCAG 3.0 |

## Decision: light-first with a user toggle (dark retained)

- The manual's §8.2 is explicit: emit light and dark values, switch on `prefers-color-scheme`, optionally overridable by a class. Light/dark is a user preference to honour, not a design direction.
- The project is civic/public — open data, OpenStreetMap, map-first. The dominant pattern for that territory is a warm paper field with deep ink and one disciplined red accent; light reads *public*, dark reads *product*.
- So: light is the default; dark is the toggle. Accents (flag red, golds, forest, green, salmon) are identical across schemes — only surfaces, ink and lines swap.

## Token architecture (manual §8.1)

ref (raw, fixed) → sys (semantic, scheme-swapped) → components consume sys only.

- ref: `--r-red/--r-gold/--r-forest/...` — the fixed brand values.
- sys (light): `--bg #f6f2e7` warm paper, `--bg-raise #fff`, `--ink #16181d`, `--line` ink@14%.
- sys (dark): `--bg #0c0e16`, `--bg-raise #12141f`, `--ink #fbfaf5`, `--line` cream@14%.
- Category chips get per-scheme text tokens (`--cat-*`) so the 9.5px labels pass AA on both paper and ink.
- Components reference `--bg/--ink/--line/--forest/...` — never raw hex.

## Theme mechanics

- Default: `prefers-color-scheme` (light wins ties via the boot script).
- Toggle: `data-theme="light|dark"` on `<html>`, persisted to `localStorage('bw-theme')`, set pre-paint by an inline script in `index.html` (no flash).
- `color-scheme: light dark` on `:root`; OSM tiles render natural in light (they're already a light basemap), filtered only in dark.

## What does NOT change

Accent palette, Anton + IBM Plex type, layout, ticket cards, map interactions, data. Surfaces and ink only.
