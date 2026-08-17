# SHIP.md — builderworkshop.ca (prototype → production)

Final report. Every claim verified by something run/read, or marked UNTESTED.

## What changed

### Audit-driven fixes (this pass)
- **F-01** reduced-motion specificity fixed (`!important`); verified flipped `false → true`.
- **F-02** `public/_headers`: CSP + nosniff + Referrer-Policy + X-Frame-Options + Permissions-Policy; verified on the live response.
- **F-08** map `role="region"` + `aria-label`; insight line `aria-live="polite"`; verified in live bundle.
- **F-03** README documents monthly re-verification cadence; Contribute invites re-verifying oldest entries.
- **F-04** README rollback runbook (revert-and-push, or dashboard redeploy).
- **F-07** CHANGELOG.md + CONTRIBUTING.md added.

### Earlier UX pass (landed prior)
Mobile menu, scroll-margin-top, main landmark, focus-visible, contrast fixes, ticket pathway cards, The Orbit, map legend/reset/zero-state/insight, podium directory, verified stamps, two-way Contribute, favicon/og/sitemap/robots/LICENSE.

## What was tested (evidence in VERIFICATION.md)

Clean build (tsc 0 / eslint 0); osv-scanner clean; secrets clean; no dangerous patterns; 10 flows × 3 widths × 2 consecutive runs, 0 console errors; Salish glyphs render; security headers + a11y fixes + open-data endpoints live; page renders under the new CSP.

## Known limitations / residual risks

- **og:image (F-05)** is a temporary public URL; one-step fix is committing `public/images/og.png` from a git-binary-capable machine and re-pointing `og:image`/`twitter:image` to `/images/og.png`.
- **OSM tile pixels** unverifiable from the sandbox; an OSM outage leaves a blank canvas but a working list (graceful).
- **`verified` stamps** all read 2026-08 (baseline); the cadence is a human process.
- **F-06** dead files (`public/videos/`, `.gitkeep`s, `info.md`) await Rule 9 approval to delete.

## Deploy steps

Push to `main` → Workers Builds runs `npm run build` (prebuild regenerates open data) → deploys → live at builderworkshop.ca + www. Rollback: revert and push, or redeploy a previous version from the dashboard.

## Verdict

READY. Two gating items are documentation/process (F-05 og:image permanence — one-step fix on a git-capable machine; F-06 deletions — awaiting approval). Neither blocks the live site.

Top-of-README line: **A public, static, open-data map and ranked directory of British Columbia's innovation ecosystem — the rooms, tools, programs and communities where builders actually build.**
