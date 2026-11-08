#!/usr/bin/env bash
#
# Ready to commit. Formats, then runs the JavaScript and PHP checks.
# The install smoke and Playwright stay on bin/ci.sh.
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

echo ""
echo "==> npm run format"
npm run format

echo ""
echo "==> composer pint"
composer pint

exec "${ROOT}/bin/ci.sh" commit
