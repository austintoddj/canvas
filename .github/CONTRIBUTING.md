# Contributing Guide

Thank you for considering a contribution to Canvas.

If you're fixing docs, translations, bugs, or features, please open a pull request and keep it focused on one change.

## Before you start

- Use PHP 8.2+ and a supported Laravel version.
- Read `readme.md` for the package install and configuration basics.
- If you're updating translations, add or adjust the matching files under `resources/lang`.

## Local Laravel app

If you want to work locally, use a Laravel app with a sibling Canvas checkout:

1. From the root of your Laravel app, add the local Canvas checkout as a Composer path repository:

    ```bash
    composer config repositories.canvas '{"type": "path", "url": "../canvas"}' --file composer.json
    ```

2. Require Canvas and finish the install:

    ```bash
    composer require austintoddj/canvas @dev
    php artisan canvas:install
    php artisan storage:link
    ```

3. To avoid re-publishing frontend assets every time you make a change, symlink the Canvas build output into your Laravel app instead:

    ```bash
    rm -rf public/vendor/canvas
    ln -s "$(cd .. && pwd)/canvas/public/vendor/canvas" public/vendor/canvas
    ```

    This symlinks the full build directory, including `assets`, `manifest.json`, and the `canvas.hot` file written by the Vite dev server.

4. From the Canvas package directory, start the Vite dev server:

    ```bash
    npm install
    npm run dev
    ```

    Canvas uses Laravel's Vite integration with a dedicated build directory (`vendor/canvas`). Running `npm run dev` starts the dev server and writes a `canvas.hot` file — this is what tells Canvas to serve assets from the dev server rather than the production build. For a production-style build, run `npm run build` instead.

5. Adjust `/canvas` if your folder layout is different.

## Before opening a pull request

- Run `npm run typecheck`, `npm run lint`, and `npm test` (CI runs these automatically)
- Run `npm run build` and commit updated assets in `public/vendor/canvas`
- Run `composer pint` (or `composer pint:test` to check without fixing — CI runs the check once)
- Run `composer test:ci` to match the PHP compatibility matrix locally

Once you've made your changes, create a pull request from your fork to the `develop` branch of the project repository.
