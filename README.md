# Builder Workshop — builderworkshop.ca

A practical map and directory of the Lower Mainland's innovation ecosystem — the spaces, programs, schools, communities, media and capital that make Greater Vancouver a workshop for builders.

**Goal:** attract, support and retain talent, and foster homegrown innovation that drives prosperity, liberty and clear societal benefit — helping Canada take a global lead in human-centric innovation.

## Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3.4
- Leaflet / React-Leaflet with OpenStreetMap tiles for the interactive asset map

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
```

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git (this repo)
2. Build command: `npm run build` · Output directory: `dist`
3. Custom domain: `builderworkshop.ca` (zone already on Cloudflare, so DNS + SSL are automatic)

## Adding / editing players

All ecosystem data lives in one file: `src/data/assets.ts`.
Each entry has a name, category, URL, blurb, location, and optional `lat`/`lng` — entries with coordinates are pinned on the OpenStreetMap asset map; entries without appear in the directory only. Categories and their colors are defined in the same file.

## Credits

- Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; geocoding via Nominatim
- Ecosystem listings are community-sourced
- Built on the unceded territories of the xʷməθkʷəy̓əm (Musqueam), Sḵwx̱wú7mesh (Squamish) and səlilwətaɬ (Tsleil-Waututh) Nations
