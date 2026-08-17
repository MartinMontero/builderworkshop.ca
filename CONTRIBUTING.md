# Contributing to builderworkshop.ca

The directory is community-sourced — this is how to add or correct a player.

## Add or edit a player

1. Open `src/data/assets.ts`.
2. Add or edit an entry in the `ASSETS` array:
   - `id` — short unique slug (e.g. `'makerlabs'`).
   - `name`, `url`, `category` (one of the six in `CATEGORIES`), `blurb` (one or two sentences, factual), `location` (`Street · Neighbourhood`, or `Online · Vancouver`, `Province-wide`, etc.).
   - `lat`/`lng` — optional. If present, the player is pinned on the asset map; if absent, it appears in the directory and The Orbit. Geocode via OpenStreetMap Nominatim.
   - `capabilities` — optional list from `CAPABILITY_LABELS` keys (3d-print, laser, cnc, wood, metal, electronics, robotics, glass, ceramics, recording, digitization). These power the "Make something" filters.
   - `verified` — set to the current `YYYY-MM` when you've confirmed the entry is accurate.
3. **The array order is the printed ranking (01–N).** Move the entry to change its rank.
4. Bump the counts in `src/sections/Hero.tsx` (players listed / venues on map), the directory heading in `src/sections/Directory.tsx` ("Forty-six ways in"), and the README ranking note.

## Verify locally

```bash
npm install
npm run build   # prebuild regenerates public/ecosystem.json + ecosystem.geojson, then tsc + vite build
npx vite preview --port 4180
```

Open `http://localhost:4180/?flat=1` (the `?flat=1` flag disables scroll animations for a stable view).

## Submit without a PR

Email these3remain@gmail.com with the player's name, URL, a one-line description, and address (if it has one).

## Rules

- Factual blurbs only — linkable claims, no hype.
- The dataset ships CC BY 4.0; the code is MIT.
- No new external runtime services (the map talks to OpenStreetMap tiles only).
