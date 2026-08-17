# Builder Workshop — builderworkshop.ca

A practical map and directory of British Columbia's innovation ecosystem — the spaces, programs, schools, communities, media and capital that make Greater Vancouver and the Lower Mainland a workshop for builders.

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

## Deploy

This is a static Vite build — a host must run `npm run build` before serving (serving the branch root directly will not work). Two supported paths:

### Option A — Cloudflare Pages (recommended; the domain is registered & hosted at Cloudflare)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → select this repo
2. Build command: `npm run build` · Output directory: `dist`
3. **Custom domains → Set up a custom domain** → `builderworkshop.ca` (add `www.builderworkshop.ca` too). Because the zone lives in the same Cloudflare account, the DNS records and SSL are created automatically — nothing to add by hand.
4. Every push to `main` auto-deploys.

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
Each entry has a name, category, URL, blurb, location, and optional `lat`/`lng` — entries with coordinates are pinned on the OpenStreetMap asset map; entries without appear in the directory only. **Array order = the directory's numbered ranking (01–43).** Categories and their colors are defined in the same file.

## Credits

- Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors; geocoding via Nominatim
- Ecosystem listings are community-sourced
- Built on the unceded territories of the xʷməθkwəy̓əm (Musqueam), Sḵwx̱wú7mesh (Squamish) and səlilwətaɬ (Tsleil-Waututh) Nations
