#!/usr/bin/env bash
#
# Checks GitHub runs after install. Preflight calls this with no arguments.
# GitHub also runs PHP 8.3 with the lowest dependencies, plus MySQL and Postgres.
#
# Usage:
#   bin/ci.sh            # js, php, install smoke, and e2e
#   bin/ci.sh js
#   bin/ci.sh php
#   bin/ci.sh php-test
#   bin/ci.sh e2e
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

step() {
  echo ""
  echo "==> $*"
}

js() {
  step "npm run typecheck"
  npm run typecheck

  step "npm run lint"
  npm run lint

  step "npm test"
  npm test

  step "npm run build"
  npm run build

  step "resources/dist is a clean build"
  if [[ -n "$(git status --porcelain -- resources/dist)" ]]; then
    git status --short -- resources/dist
    echo "::error::resources/dist does not match a clean build. Run npm run build with the Node in .nvmrc and commit resources/dist."
    exit 1
  fi
}

php_test() {
  step "composer test"
  composer test
}

php() {
  step "composer pint:test"
  composer pint:test

  step "composer lint"
  composer lint

  php_test
}

e2e() {
  step "Laravel 13 host"
  bash bin/e2e-prepare.sh 13

  if [[ "${CI:-}" == "true" ]]; then
    step "npx playwright install --with-deps chromium"
    npx playwright install --with-deps chromium
  else
    step "npx playwright install chromium"
    npx playwright install chromium
  fi

  step "npm run e2e"
  npm run e2e
}

case "${1:-all}" in
  js) js ;;
  php) php ;;
  php-test) php_test ;;
  e2e) e2e ;;
  all)
    js
    php
    step "install smoke"
    bash bin/install-smoke.sh 12
    e2e
    echo ""
    echo "==> CI checks passed."
    ;;
  *)
    echo "Unknown target: $1" >&2
    exit 1
    ;;
esac
