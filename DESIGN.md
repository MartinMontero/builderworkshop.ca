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

## Decision: two intentional schemes, one system

The manual's §8.2 requires emitting light and dark values and switching on `prefers-color-scheme` with an optional manual override — so both schemes ship. But the earlier build's failure was not the light/dark axis; it was a missing *system*. This revision fixes the system:

- **One accent, used sparingly.** Flag red is the only brand accent — the primary action, the brand mark, the eyebrow, the editorial emphasis. Everything else is ink and surface. This is the Apple-restraint layer (manual §0, §8.6 "one primary action per view").
- **Category colour is a dot, not a flood.** The six categories get small marker dots and muted per-scheme text (`--cat-*`), tuned to AA on each surface. They differentiate without turning the page into a rainbow.
- **Tonal elevation, not shadow.** Dark scheme raises surfaces by going *lighter* (`--bg-raise #14161d` over `--bg #0b0c10`), per manual §8.2 — not by stacking heavier shadows.
- **Light = warm paper, ink text** (`--bg #f3efe6`, `--ink #15161a`, text-red `#a81e14` for AA). **Dark = near-black ink, off-white text** (`--bg #0b0c10`, `--ink #f3f1ea`, lifted red `#ee4a3d` for AA).
- **Typography carries the hierarchy** — Anton display for editorial weight, IBM Plex Mono for data labels, IBM Plex Sans for body.

## Token architecture (manual §8.1)

ref (raw, fixed) → sys (semantic, scheme-swapped) → components consume sys only.

- ref: `--r-red/--r-red-hi/--r-forest/--r-gold/--r-cream/--r-ink` — fixed brand values.
- sys: `--bg/--bg-raise/--bg-sink/--ink/--ink-soft/--ink-faint/--line/--line-strong/--brand/--brand-ink/--accent/--focus/--cat-*` — swap per scheme.
- Components reference sys tokens only, never raw hex.

## Theme mechanics

- Default: `prefers-color-scheme`.
- Toggle: `data-theme="light|dark"` on `<html>`, persisted to `localStorage('bw-theme')`, set pre-paint by an inline script in `index.html` (no flash).
- `color-scheme: light dark` on `:root`; OSM tiles natural in light, filtered in dark.

## What does NOT change

Anton + IBM Plex type, layout, ticket cards, map interactions, data. Surfaces, ink, and the one-accent discipline only.
