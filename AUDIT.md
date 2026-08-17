# AUDIT.md — builderworkshop.ca (prototype → production)

Read-only research. Evidence = command output or file:line. Findings ranked P0/P1/P2.

## Repo map

- Stack: React 19.2, TS ~5.9 (strict), Vite 7, Tailwind 3.4, Leaflet 1.9 + react-leaflet 5, OSM tiles.
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx` → Nav / Hero / Marquee / AssetMap / Directory / Pathways / Mission / Contribute / Footer.
- Data: single source `src/data/assets.ts` (46 players, `MAPPED` = 27 with coords, `PATHWAYS` = 4 trails, `CATEGORY_COLORS`, `CAPABILITY_LABELS`). `scripts/export-data.mjs` (esbuild) regenerates `public/ecosystem.json` + `public/ecosystem.geojson` on prebuild.
- Build: `prebuild` (export-data) → `tsc -b` → `vite build` → `dist/`. Deploy: Cloudflare Workers Builds from `main`, SPA fallback, custom domains.
- Design tokens: `:root` in `src/index.css` — `--ink #12141f`, `--ink-deep #0c0e16`, `--cream #fbfaf5`, `--red #d52b1e`, `--red-deep #a81e14`, `--gold #f5b800`, `--forest #84bd00`, `--forest-hi #cedc00`, `--green #34c76b`, `--salmon #ff8fa3`.

## Verified baseline (evidence)

- Clean build passes: `npm run build` → dist, 0 type errors (tsc -b exit 0).
- ESLint: `npx eslint .` → 0 errors.
- osv-scanner 2.5.1 on package-lock.json (296 pkgs): **No issues found**.
- Secrets grep over src/public/scripts/configs + all git commits: **none present**.
- No `dangerouslySetInnerHTML` / `eval` / `new Function` / `innerHTML` in src/ (grep: none).
- Flow pass (headless Chromium, `?flat=1`): anchors 4/4, partner buttons 2, directory rows 46, capability insight line correct, filtered list 5, trail chip + polyline render on `bw:trail`, Orbit 19 cards, mobile menu 4 links + 2 partners, **0 console errors**.

## Findings

### P1 — correctness / UX

- **F-01 | P1 | a11y | compiled CSS order | Evidence: `@media (prefers-reduced-motion)` precedes `.marquee-track{animation:bw-marquee}` in dist; equal specificity, later rule wins → headless `reducedMotion:false`.** Fixed: `!important` on the animation-stopping rules. Verified flipped to true.
- **F-02 | P1 | security headers | `public/` ABSENT `_headers`.** Fixed: added `public/_headers` (CSP + nosniff + Referrer-Policy + X-Frame-Options + Permissions-Policy). Verified on the live response.
- **F-03 | P1 | data staleness | every entry `verified:'2026-08'`.** Fixed (process): README documents the monthly re-verification cadence; Contribute invites re-verifying oldest entries.
- **F-04 | P1 | deploy rollback | README ABSENT rollback runbook.** Fixed: Deploy → Rollback documents revert-and-push + dashboard redeploy.
- **F-05 | P1 | og:image | points to a temporary public file URL.** Deferred — needs a git-binary-capable machine to commit `public/images/og.png`. Documented in SHIP.md with the one-step fix.

### P2 — polish

- **F-06 | P2 | repo hygiene | `public/images/.gitkeep`, `public/videos/.gitkeep`, empty `public/videos/`, stray `info.md`.** Rule 9 — deletion listed, awaiting approval.
- **F-07 | P2 | docs | CHANGELOG + CONTRIBUTING ABSENT.** Fixed: both added.
- **F-08 | P2 | a11y | map region unlabelled; insight line not announced.** Fixed: `role="region"`/`aria-label` + `aria-live="polite"`. Verified in live bundle.
- **F-09 | P2 | i18n | footer Salish glyphs.** Verified rendering correctly, no tofu.

### Cleared (closest calls)

Dangerous-HTML/eval: clean. ESLint + tsc: 0 errors. osv-scanner: no issues across 296 packages. Secrets: none. 10 flows × 3 widths × 2 runs: all pass, 0 console errors.

## Non-goals (held)

No new features beyond prototype scope; no redesign; no accounts/backend; no events calendar; no new runtime services beyond OSM tiles.
