#!/usr/bin/env bash
# Phase E — verify Cloudflare deployment claims against OFFICIAL documentation.
#
# The build container's egress gateway denies every Cloudflare domain with a 403
# on CONNECT, so the claims in the Phase E owner-setup brief were secondary-only.
# ARCHITECTURE.md ADR-2a already established the remedy: retrieve evidence from a
# GitHub Actions runner, which has unrestricted egress.
#
# No credential is used. No Cloudflare account is contacted. Read-only, $0.
set -uo pipefail

OUT="${1:-cloudflare-docs}"
mkdir -p "$OUT"

BASE="https://developers.cloudflare.com"
declare -a PAGES=(
  "d1-pricing|$BASE/d1/platform/pricing/"
  "d1-limits|$BASE/d1/platform/limits/"
  "workers-pricing|$BASE/workers/platform/pricing/"
  "workers-limits|$BASE/workers/platform/limits/"
  "r2-pricing|$BASE/r2/pricing/"
  "token-permissions|$BASE/fundamentals/api/reference/permissions/"
  "token-create|$BASE/fundamentals/api/get-started/create-token/"
  "billing-policy|$BASE/billing/understand/billing-policy/"
  "workers-dev|$BASE/workers/configuration/routing/workers-dev/"
  "wrangler-env|$BASE/workers/wrangler/system-environment-variables/"
  "wrangler-commands|$BASE/workers/wrangler/commands/"
)

strip_html() {
  # Drop script/style blocks, then tags, then collapse blank lines.
  perl -0777 -pe 's{<(script|style)\b.*?</\1>}{}gsi' \
    | perl -0777 -pe 's{<[^>]+>}{ }gs' \
    | perl -0777 -pe 's{&nbsp;}{ }gs; s{&amp;}{\&}gs; s{&lt;}{<}gs; s{&gt;}{>}gs; s{&#\d+;}{}gs' \
    | tr -s ' ' \
    | sed '/^[[:space:]]*$/d'
}

echo "### Fetch results"
for entry in "${PAGES[@]}"; do
  name="${entry%%|*}"; url="${entry#*|}"
  code=$(curl -sS -L --max-time 45 -o "$OUT/$name.html" -w '%{http_code}' "$url" 2>"$OUT/$name.err" || echo 000)
  bytes=$(wc -c < "$OUT/$name.html" 2>/dev/null || echo 0)
  printf '%-20s %s  %8s bytes  %s\n' "$name" "$code" "$bytes" "$url"
  if [ "$code" = "200" ]; then
    strip_html < "$OUT/$name.html" > "$OUT/$name.txt"
  fi
done

show() {
  local file="$1"; shift
  local label="$1"; shift
  echo
  echo "=== $label  ($file) ==="
  if [ ! -s "$OUT/$file.txt" ]; then echo "(no text extracted)"; return; fi
  for pat in "$@"; do
    echo "--- /$pat/"
    grep -o -i -E ".{0,180}${pat}.{0,220}" "$OUT/$file.txt" | head -4
  done
}

show d1-pricing        "D1 free-tier limits and payment requirement" \
  "rows read" "rows written" "storage" "free plan" "Workers Free" "payment|credit card|billing"
show d1-limits         "D1 hard limits" \
  "Databases" "Maximum database size" "Maximum string|Maximum SQL statement|column|row size"
show workers-pricing   "Workers Free plan" \
  "100,000 requests" "Free plan" "workers.dev"
show workers-limits    "Workers subrequest and CPU limits" \
  "subrequest" "50/1000|Simultaneous open connections|CPU time"
show r2-pricing        "R2 free tier and payment requirement" \
  "10 GB|10 GB-month" "Class A|Class B" "free" "payment|credit card"
show token-permissions "API token permission names" \
  "Workers Scripts" "Workers R2 Storage" "\bD1\b" "Account Settings" "Workers KV Storage"
show token-create      "Token creation and scoping" \
  "Account Resources|Zone Resources" "TTL|expire" "least"
show billing-policy    "Payment-method policy" \
  "payment method" "usage-based"
show workers-dev       "workers.dev subdomain" \
  "workers.dev" "subdomain" "register|choose"
show wrangler-env      "Wrangler credential environment variables" \
  "CLOUDFLARE_API_TOKEN" "CLOUDFLARE_ACCOUNT_ID"
show wrangler-commands "Wrangler commands Factory needs" \
  "d1 create" "secret put" "wrangler deploy"

echo
echo "### Done. Full extracted text uploaded as an artifact."
