# Changelog

All notable changes to builderworkshop.ca. Newest first.

## [Production hardening] — 2026-08-17

### Fixed (audit-driven)
- Reduced-motion now actually stops the marquee, scroll-cue, and map-marker pulse (`!important` — the media query was being overridden by later rules of equal specificity).
- Added `public/_headers` (CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy) for the Cloudflare Workers static-assets target.
- Map region now has `role="region"` + `aria-label`; the capability insight line is `aria-live="polite"`.
- README documents the monthly re-verification cadence for `verified` stamps, and the Workers Builds rollback runbook. Contribute invites re-verifying the oldest entries.
- Added CHANGELOG (this file) and CONTRIBUTING.md.

## [UX pass] — 2026-08-17

- Full-screen mobile menu (hamburger → numbered section links + partner links + ADD A PLAYER).
- `scroll-margin-top` on sections (fixed nav no longer overlaps headings); `<main>` landmark; `:focus-visible` states.
- Contrast: Capital & Venture moved off near-white to `#f5b800`, Programs to `#f0a500`; muted text raised to AA.
- Pathways: ticket-style cards (stub header + route diagram); new **The Orbit** section for the 19 players with no fixed venue.
- Map: RESET control, friendlier zero-state, capability insight line ("Laser Cutting: 5 venues — densest in Strathcona…").
- Directory: podium weight (top 10 larger, flag-red numerals), per-row `verified` stamps.
- Contribute: two-way door (SUBMIT A PLAYER + TAKE THE DATA).
- Plumbing: favicon (inline), og:image + Twitter card, canonical, sitemap.xml, robots.txt, MIT LICENSE.

## [Ecosystem features] — 2026-08-17

- Pathways: 4 curated trails (Gastown Founder Crawl, Strathcona Maker Mile, Free-Build Circuit, Island Maker Run), drawable on the map as a dashed route.
- "Make something" capability filters on the asset map (3D printing, laser, CNC, wood, metal, electronics, robotics, glass, ceramics, recording, digitization).
- Open data: `/ecosystem.json` (full directory, CC BY 4.0) + `/ecosystem.geojson` (mapped venues), regenerated every build.

## [Content]

- Directory grown 36 → 46 players (Internet Archive Canada, Frontier Collective, Civic Innovation Lab, SFU Surrey, Women Transforming Cities, Flow State Founder, FoundedIn Canada, BitDevs Vancouver, BC Founders Day, Futurpreneur, and the hackspace.ca BC spaces).
- Ranking curated; palette re-themed to Canada flag red + BC forest/highlight green.

## [Initial prototype]

- Single-page Vite + React + Leaflet site: hero, asset map, ranked directory, mission, contribute, footer.
