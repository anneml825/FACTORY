#!/usr/bin/env bash
# Phase E — verify Cloudflare deployment claims against OFFICIAL documentation.
#
# The build container's egress gateway denies every Cloudflare domain with a 403
# on CONNECT, so the Phase E owner-setup brief could only cite secondary sources
# for free-tier limits, payment-method requirements, and API-token permission
# names. ARCHITECTURE.md ADR-2a already established the remedy: retrieve
# evidence from a GitHub Actions runner, which has unrestricted egress.
#
# Fetches the Markdown rendering of each page (developers.cloudflare.com serves
# `<page>index.md`), because the numeric limits live in tables that HTML tag
# stripping destroys.
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
  "billing-policy|$BASE/billing/understand/billing-policy/"
  "workers-dev|$BASE/workers/configuration/routing/workers-dev/"
  "wrangler-env|$BASE/workers/wrangler/system-environment-variables/"
)

echo "### Fetch results (Markdown renderings)"
for entry in "${PAGES[@]}"; do
  name="${entry%%|*}"; url="${entry#*|}"
  code=$(curl -sS -L --max-time 45 -o "$OUT/$name.md" -w '%{http_code}' "${url}index.md" 2>/dev/null || echo 000)
  if [ "$code" != "200" ]; then
    code=$(curl -sS -L --max-time 45 -o "$OUT/$name.md" -w '%{http_code}' "${url%/}.md" 2>/dev/null || echo 000)
  fi
  printf '%-20s %s  %8s bytes  %sindex.md\n' "$name" "$code" "$(wc -c < "$OUT/$name.md")" "$url"
done

section() {
  local file="$1" label="$2" pattern="$3" before="${4:-2}" after="${5:-14}"
  echo
  echo "=== $label  ($file.md) ==="
  if [ ! -s "$OUT/$file.md" ]; then echo "(not fetched)"; return; fi
  grep -n -i -E -B"$before" -A"$after" "$pattern" "$OUT/$file.md" | head -45
}

section d1-pricing      "D1 included limits per plan"        '^\|.*(Rows read|Rows written|Storage)|included limits' 3 12
section d1-pricing      "D1 free-plan behaviour at the cap"  'exceed the daily limits|Free plan will always' 1 8
section d1-limits       "D1 hard limits table"               'Databases per account|Maximum database size|Maximum string' 4 10
section workers-pricing "Workers Free plan limits"           'Requests.*\|.*100,000|100,000 requests' 3 10
section workers-limits  "Free vs Paid limits table"          '^\|.*(Subrequests|Daily requests|CPU time)' 3 10
section workers-limits  "Subrequest detail"                  'Subrequests\b' 1 12
section r2-pricing      "R2 free tier table"                 'Free tier|10 GB / month|Class A Operations' 3 14
section billing-policy  "Usage-based billing and payment"    'usage-based billing|preauthorize' 2 10
section workers-dev     "workers.dev suitability"            'business-critical|Free website|come with a workers.dev' 2 6
section wrangler-env    "Credential environment variables"   'CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID' 2 6
section token-permissions "Exact permission names"           '(Workers Scripts|Workers R2 Storage|Account Settings|^\| D1) ' 1 3

echo
echo "### Done. Full Markdown uploaded as an artifact."
