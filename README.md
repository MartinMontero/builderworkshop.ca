# Builder Workshop — builderworkshop.ca

A practical map and directory of British Columbia's innovation ecosystem — the spaces, programs, schools, communities, media and capital that make Greater Vancouver and the Lower Mainland a workshop for builders.

**Goal:** attract, support and retain talent, and foster homegrown innovation that drives prosperity, liberty and clear societal benefit — helping Canada take a global lead in human-centric innovation.

## Features

- **The Asset Map** — every physical venue pinned on OpenStreetMap, filterable by category and by *capability* (3D printing, laser cutting, CNC, woodshop, metalshop, electronics, robotics, glass, ceramics, recording, digitization) so a builder can answer "where can I actually make X?" in one click.
- **The Players** — a ranked directory of ecosystem players; array order in `src/data/assets.ts` is the printed ranking.
- **The Pathways** — curated walking trails that chain venues into routes (e.g. The Strathcona Maker Mile), drawable on the map; plus **The Orbit** — the players with no fixed venue, and how to plug into each. And **The Builder's Stack** — how to use this site alongside friends & collaborators (buildrs.dev for events/shipping, FoundedIn Canada for funding/the national layer), zero → one → MVP → scale.
- **Light / dark themes** — token-based, defaults to your OS `prefers-color-scheme`, manual toggle in the nav (persisted).
- **Open data** — the whole directory is published as [`public/ecosystem.json`](public/ecosystem.json) (full directory, CC BY 4.0) and [`public/ecosystem.geojson`](public/ecosystem.geojson) (mapped venues as GeoJSON points), regenerated on every build by `scripts/export-data.mjs`. Take the data and build with it.

## Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3.4
- Leaflet / React-Leaflet with OpenStreetMap tiles for the interactive asset map
- Token-based theming (see DESIGN.md): light-first, dark retained, user-toggleable

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # runs scripts/export-data.mjs (prebuild), then tsc + vite build → dist/
```

## Deploy

This is a static Vite build — a host must run `npm run build` before serving (serving the branch root directly will not work). Two supported paths:

### Option A — Cloudflare Pages (recommended; the domain is registered & hosted at Cloudflare)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → select this repo
2. Build command: `npm run build` · Output directory: `dist`
3. **Custom domains → Set up a custom domain** → `builderworkshop.ca` (add `www.builderworkshop.ca` too). Because the zone lives in the same Cloudflare account, the DNS records and SSL are created automatically — nothing to add by hand.
4. Every push to `main` auto-deploys.

**Rollback:** revert the offending commit and push — Workers Builds redeploys the prior state automatically. Or, in the Cloudflare dashboard → Workers → builderworkshop-ca → Deployments, redeploy a previous version directly (instant, no rebuild).

If you previously enabled GitHub Pages on this repo, turn it off to avoid confusion (Settings → Pages → Source → None) — DNS will point at Cloudflare, not GitHub.

### Option B — GitHub Pages

1. Repo → **Settings → Pages → Source: GitHub Actions** (NOT "Deploy from a branch" — the branch root is unbuilt source and will not run).
2. Add the build workflow: **Actions → New workflow → set up a workflow yourself**, name it `deploy.yml`, paste this, commit:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. Keep the custom domain `builderworkshop.ca` in Settings → Pages (a `CNAME` file ships in `public/`, so it lands in every build).
4. In Cloudflare → **DNS → Records → Add record**, create the following, all with **Proxy status: DNS only** (gray cloud — required until GitHub verifies the domain and issues the HTTPS certificate):
   - `A` `@` → `185.199.108.153`
   - `A` `@` → `185.199.109.153`
   - `A` `@` → `185.199.110.153`
   - `A` `@` → `185.199.111.153`
   - `CNAME` `www` → `martinmontero.github.io`
5. Back in Settings → Pages, click **Check again**; once the DNS check passes and the certificate is issued, enable **Enforce HTTPS**.

## Adding / editing players

All ecosystem data lives in one file: `src/data/assets.ts`.
Each entry has a name, category, URL, blurb, location, optional `lat`/`lng` (entries with coordinates are pinned on the asset map; entries without appear in the directory only), optional `capabilities` (equipment/facilities — these power the map's "Make something" filters), and a `verified` stamp (`YYYY-MM`). **Array order = the directory's numbered ranking (01–46).** Categories, their colors, capability labels and the Pathways trails are defined in the same file.

**Freshness:** the directory is re-verified monthly. Each entry's `verified` stamp is bumped to the current month when it's re-checked; the oldest stamps are re-visited first. If a listing is wrong or has closed, email these3remain@gmail.com or open a PR.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

- Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; geocoding via Nominatim
- Ecosystem listings are community-sourced
- Built on the unceded territories of the xʷməθkwəy̓əm (Musqueam), Sḵwx̱wú7mesh (Squamish) and səlilwətaɬ (Tsleil-Waututh) Nations
- Built by [Martin Montero](https://www.linkedin.com/in/martinmontero) as a gift to builders
