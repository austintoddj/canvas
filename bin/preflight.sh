#!/usr/bin/env bash
#
# Local run of the CI checks.
#
# Usage:
#   bin/preflight.sh
#   npm run preflight
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if [[ ! -d node_modules ]]; then
  echo ""
  echo "==> npm ci"
  npm ci
fi

if [[ ! -d vendor ]]; then
  echo ""
  echo "==> composer install"
  composer install --no-interaction --no-progress
fi

exec "${ROOT}/bin/ci.sh"
