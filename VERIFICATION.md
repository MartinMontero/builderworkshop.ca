# VERIFICATION.md — builderworkshop.ca

Two consecutive full runs of the flow list, headless Chromium, three widths each. Evidence = the JSON result objects.

## Build gates

- Clean build from scratch: PASS, dist emitted, `_headers` present in dist.
- `tsc -b`: 0 errors. `eslint .`: 0 errors.
- osv-scanner 2.5.1 (296 packages): No issues found.
- Secrets grep (source + history): none. Dangerous patterns: none.

## Flow results (identical on run 1 and run 2)

```json
{"desktop":{"anchors":true,"rows":46,"orbit":19,"mapRegion":true,"insight":true,"insightAriaLive":true,"polyline":true},
 "tablet":{"anchors":true,"rows":46,"orbit":19,"mapRegion":true,"insight":true,"insightAriaLive":true,"polyline":true},
 "mobile":{"anchors":true,"rows":46,"orbit":19,"mapRegion":true,"menuLinks":4,"insight":true,"insightAriaLive":true,"polyline":true},
 "reducedMotion":true}
ERRORS: []   // both runs, zero console/page errors
```

| Flow | desktop | tablet | mobile |
|---|---|---|---|
| Section anchors present | PASS | PASS | PASS |
| Directory rows = 46 | PASS | PASS | PASS |
| The Orbit = 19 cards | PASS | PASS | PASS |
| Map region labelled | PASS | PASS | PASS |
| Capability filter → insight, aria-live | PASS | PASS | PASS |
| Pathway walk → polyline drawn | PASS | PASS | PASS |
| Mobile menu → 4 links | — | — | PASS |
| reduced-motion stops marquee | PASS (post-F-01) | — | — |

Open-data endpoints live: `/ecosystem.json` (46 players) 200 application/json; `/ecosystem.geojson` (27 features) 200 application/geo+json.

## Consecutive-clean-runs exit

Run 1: all pass, 0 errors. Run 2: identical, 0 errors. **Condition met.**

## Notes

- F-09 Salish glyphs render correctly (no tofu).
- OSM tile pixels not verifiable from the sandbox (outbound blocked); logic verified headlessly, tiles confirmed on the live site externally.
