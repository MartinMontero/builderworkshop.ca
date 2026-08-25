#!/usr/bin/env bash
# Threshold sweep driver: for each threshold, set it on the instance and run
# every query in queries.txt, saving raw JSON per query.
#
# Requires wrangler OAuth (the .env token cannot PATCH instance config).
# IMPORTANT: disable the similarity cache first, or every threshold after the
# first returns cached (frozen) results:
#   npx wrangler ai-search update builderworkshop-map --cache false
# Restore it when done:  --cache true
#
# Usage: bash scripts/ai-search-tuning/sweep.sh [instance] [out-dir]
set -u
INSTANCE="${1:-builderworkshop-map}"
HERE="$(cd "$(dirname "$0")" && pwd)"
RES="${2:-$HERE/results/sweep}"
THRESHOLDS="${THRESHOLDS:-0.4 0.38 0.36 0.35 0.33 0.3 0.25 0.2 0.15}"
mkdir -p "$RES"
for T in $THRESHOLDS; do
  npx wrangler ai-search update "$INSTANCE" --score-threshold "$T" --json > /dev/null 2>&1
  sleep 5   # config propagation; the first search right after an update can transiently return empty
  mkdir -p "$RES/T$T"
  while IFS='|' read -r qid q; do
    npx wrangler ai-search search "$INSTANCE" --query "$q" --json 2>/dev/null > "$RES/T$T/$qid.json"
    # retry once on empty output (post-update flakiness)
    grep -q '"chunks"' "$RES/T$T/$qid.json" || { sleep 2; npx wrangler ai-search search "$INSTANCE" --query "$q" --json 2>/dev/null > "$RES/T$T/$qid.json"; }
  done < "$HERE/queries.txt"
  echo "threshold $T done"
done
echo "sweep complete: $RES"
