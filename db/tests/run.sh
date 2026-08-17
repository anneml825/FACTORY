#!/usr/bin/env bash
# Verifies that CONSTITUTION.md's financial and evidentiary protections are enforced
# by the database. Nine violation attempts must be REJECTED; three valid operations
# must SUCCEED. See db/tests/EXPECTED.md for the verified baseline.
#
# Usage: DATABASE_URL=postgres://... ./db/tests/run.sh
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to a scratch database — this script writes test rows}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$(dirname "$0")/../schema.sql"
psql "$DATABASE_URL" -f "$(dirname "$0")/invariants.sql"
