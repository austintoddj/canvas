#!/usr/bin/env bash
#
# Prepare a real Laravel host for Playwright e2e (path-install Canvas + admin user).
# Writes the host path to .e2e-host (gitignored via /build-style local files).
#
# Usage:
#   bin/e2e-prepare.sh [laravel-major]
#   E2E_HOST_DIR=/tmp/canvas-e2e bin/e2e-prepare.sh 12
#
set -euo pipefail

LARAVEL_VERSION="${1:-${LARAVEL_VERSION:-12}}"
PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E_HOST_DIR="${E2E_HOST_DIR:-${PACKAGE_ROOT}/.e2e-host-app}"

if [[ -d "${E2E_HOST_DIR}" ]]; then
    # Fresh host each run so package changes are re-required cleanly.
    rm -rf "${E2E_HOST_DIR}"
fi

mkdir -p "${E2E_HOST_DIR}"
# install-smoke requires empty dir; we just created it empty
rmdir "${E2E_HOST_DIR}" 2>/dev/null || true

export CANVAS_E2E=1
export KEEP_HOST=1
export HOST_DIR="${E2E_HOST_DIR}"

# SPA e2e hits published package assets. Rebuild dist first when node_modules exists
# so data-hooks and latest UI land in public/vendor/canvas after install.
if [[ -d "${PACKAGE_ROOT}/node_modules" && -f "${PACKAGE_ROOT}/package.json" ]]; then
    echo "==> Building package frontend assets (resources/dist)"
    (cd "${PACKAGE_ROOT}" && npm run build)
fi

bash "${PACKAGE_ROOT}/bin/install-smoke.sh" "${LARAVEL_VERSION}"

# Point Playwright / CI at this host.
printf '%s\n' "${E2E_HOST_DIR}" > "${PACKAGE_ROOT}/.e2e-host"
echo "==> E2E host ready: ${E2E_HOST_DIR}"
echo "    Marker file: ${PACKAGE_ROOT}/.e2e-host"
