#!/usr/bin/env bash
#
# Pre-commit checklist: update deps, lint/format, build, and format PHP.
#
# Usage:
#   bin/preflight.sh
#   npm run preflight
#   composer preflight
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

step() {
    echo ""
    echo "==> $*"
}

step "npm update"
npm update

step "npm run lint"
npm run lint

step "npm run format"
npm run format

step "npm run build"
npm run build

step "composer update"
composer update

step "composer pint"
composer pint

echo ""
echo "==> Preflight complete. Review the diff, then commit."
