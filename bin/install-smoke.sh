#!/usr/bin/env bash
#
# Real-host install smoke: create a fresh Laravel app, path-require Canvas,
# run canvas:install, grant admin, and exercise core HTTP journeys.
#
# Usage:
#   bin/install-smoke.sh [laravel-major]
#   LARAVEL_VERSION=13 HOST_DIR=/tmp/canvas-host KEEP_HOST=1 bin/install-smoke.sh
#
# Env:
#   LARAVEL_VERSION  Major version (default: 12, or first CLI arg)
#   HOST_DIR         Where to create the app (default: mktemp)
#   KEEP_HOST=1      Leave the host app on disk after success/failure
#   PACKAGE_ROOT     Canvas checkout (default: parent of bin/)
#
set -euo pipefail

LARAVEL_VERSION="${1:-${LARAVEL_VERSION:-12}}"
PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_DIR="${HOST_DIR:-}"
CREATED_HOST=0

if [[ -z "${HOST_DIR}" ]]; then
    HOST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/canvas-install-smoke.XXXXXX")"
    CREATED_HOST=1
fi

CONSTRAINT="^${LARAVEL_VERSION}.0"

cleanup() {
    local code=$?
    if [[ "${KEEP_HOST:-0}" == "1" ]]; then
        echo "==> Host app kept at: ${HOST_DIR}"
    elif [[ "${CREATED_HOST}" == "1" && -d "${HOST_DIR}" ]]; then
        rm -rf "${HOST_DIR}"
    fi
    exit "${code}"
}
trap cleanup EXIT

echo "==> Install smoke: Laravel ${LARAVEL_VERSION} ← ${PACKAGE_ROOT}"
echo "    Host: ${HOST_DIR}"

if [[ ! -f "${PACKAGE_ROOT}/composer.json" ]]; then
    echo "error: PACKAGE_ROOT does not look like the Canvas checkout: ${PACKAGE_ROOT}" >&2
    exit 1
fi

if [[ ! -d "${HOST_DIR}" ]]; then
    mkdir -p "${HOST_DIR}"
fi

if [[ -n "$(ls -A "${HOST_DIR}" 2>/dev/null || true)" ]]; then
    echo "error: HOST_DIR is not empty: ${HOST_DIR}" >&2
    exit 1
fi

echo "==> composer create-project laravel/laravel:${CONSTRAINT}"
composer create-project "laravel/laravel:${CONSTRAINT}" "${HOST_DIR}" \
    --no-interaction \
    --prefer-dist \
    --no-progress

cd "${HOST_DIR}"

# Prefer file-backed SQLite so artisan commands use a real database file.
touch database/database.sqlite
if [[ -f .env ]]; then
    if grep -q '^DB_CONNECTION=' .env; then
        sed -i.bak 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env
    else
        echo 'DB_CONNECTION=sqlite' >> .env
    fi
    if grep -q '^DB_DATABASE=' .env; then
        sed -i.bak "s|^DB_DATABASE=.*|DB_DATABASE=${HOST_DIR}/database/database.sqlite|" .env
    else
        echo "DB_DATABASE=${HOST_DIR}/database/database.sqlite" >> .env
    fi
    rm -f .env.bak
fi

# Stock laravel/laravel has no auth UI. Canvas auth middleware redirects guests
# to route('login'), so register a minimal named route for smoke assertions.
if ! grep -q "->name('login')" routes/web.php 2>/dev/null; then
    cat >> routes/web.php <<'PHP'

Route::get('/login', static fn () => response('login'))->name('login');
PHP
fi

# Optional browser e2e helpers (Playwright). Enabled when CANVAS_E2E=1.
if [[ "${CANVAS_E2E:-0}" == "1" ]] && ! grep -q '__canvas_e2e' routes/web.php 2>/dev/null; then
    if grep -q '^CANVAS_E2E=' .env 2>/dev/null; then
        sed -i.bak 's/^CANVAS_E2E=.*/CANVAS_E2E=1/' .env
        rm -f .env.bak
    else
        echo 'CANVAS_E2E=1' >> .env
    fi

    cat >> routes/web.php <<'PHP'

if (filter_var(env('CANVAS_E2E', false), FILTER_VALIDATE_BOOL)) {
    Route::get('/__canvas_e2e/health', static fn () => response('ok', 200));
    Route::get('/__canvas_e2e/login/{email}', static function (string $email) {
        $user = \App\Models\User::query()->where('email', $email)->firstOrFail();
        auth()->login($user);

        return redirect('/canvas');
    })->where('email', '.*');
}
PHP
fi

echo "==> Path-require austintoddj/canvas@dev"
composer config repositories.canvas \
    "{\"type\":\"path\",\"url\":\"${PACKAGE_ROOT}\",\"options\":{\"symlink\":true}}"
composer require austintoddj/canvas:@dev \
    --no-interaction \
    --no-progress \
    --prefer-source

echo "==> canvas:install"
php artisan canvas:install --no-interaction

echo "==> storage:link"
php artisan storage:link --no-interaction

echo "==> Seed host user + canvas:make-admin"
php artisan tinker --execute="
\\App\\Models\\User::factory()->create([
    'name' => 'Smoke Admin',
    'email' => 'smoke@example.com',
    'password' => bcrypt('password'),
]);
"

php artisan canvas:make-admin smoke@example.com

# Browser e2e needs a second role + optional public reader UI.
if [[ "${CANVAS_E2E:-0}" == "1" ]]; then
    echo "==> Seed contributor user for permission journeys"
    php artisan tinker --execute="
\\App\\Models\\User::factory()->create([
    'name' => 'Smoke Contributor',
    'email' => 'contributor@example.com',
    'password' => bcrypt('password'),
]);
"
    php artisan canvas:assign-role contributor@example.com contributor

    echo "==> Install canvas:ui reader frontend"
    php artisan canvas:ui --force --no-interaction
    if ! grep -q "canvas-ui.php" routes/web.php 2>/dev/null; then
        printf "\nrequire __DIR__.'/canvas-ui.php';\n" >> routes/web.php
    fi
fi

php artisan tinker --execute="
if (! \\Illuminate\\Support\\Facades\\Schema::hasTable('canvas_posts')) {
    throw new RuntimeException('canvas_posts missing after install');
}
if (! \\Illuminate\\Support\\Facades\\Schema::hasTable('canvas_users')) {
    throw new RuntimeException('canvas_users missing after install');
}
if (\\Canvas\\Models\\CanvasUser::query()->count() < 1) {
    throw new RuntimeException('canvas:make-admin did not create a canvas_users row');
}
if (! is_file(config_path('canvas.php'))) {
    throw new RuntimeException('config/canvas.php was not published');
}
if (! is_dir(public_path('vendor/canvas'))) {
    throw new RuntimeException('public/vendor/canvas assets were not published');
}
echo 'CLI install checks OK'.PHP_EOL;
"

echo "==> HTTP feature smoke (host phpunit)"
mkdir -p tests/Feature
cp "${PACKAGE_ROOT}/bin/install-smoke/CanvasInstallSmokeTest.php" \
    tests/Feature/CanvasInstallSmokeTest.php

php artisan test --compact tests/Feature/CanvasInstallSmokeTest.php

echo "==> Install smoke passed (Laravel ${LARAVEL_VERSION})"
