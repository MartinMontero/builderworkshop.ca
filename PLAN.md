# PLAN.md — builderworkshop.ca (prototype → production)

Ordered by dependency then severity. Each item maps to AUDIT.md findings. Non-goals from AUDIT.md hold.

## Fixes (priority order) — all landed unless noted

1. **F-01** reduced-motion `!important` → `src/index.css`. Done; verified `reducedMotion:true`.
2. **F-02** `public/_headers` CSP + security headers. Done; verified on live response.
3. **F-03** staleness process → README cadence + Contribute re-verify line. Done.
4. **F-04** rollback runbook → README. Done.
5. **F-08** map a11y → `role="region"`/`aria-label` + `aria-live="polite"`. Done; verified in bundle.
6. **F-07** CHANGELOG + CONTRIBUTING. Done.
7. **F-05** og:image permanent home — deferred (needs git-binary push). Documented in SHIP.md.
8. **F-06** repo hygiene deletions — Rule 9, awaiting approval.
9. **F-09** footer glyph rendering — verified pass.

## Rule 9 listing (destructive — approval requested, not executed)

- Delete `public/images/.gitkeep`, `public/videos/.gitkeep`, empty `public/videos/`, and `info.md`. Rationale: dead weight / confusion. Reversible via git history.
