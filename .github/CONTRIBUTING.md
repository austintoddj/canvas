# Contributing Guide

Thank you for considering a contribution to Canvas.

If you're fixing docs, translations, bugs, or features, please open a pull request and keep it focused on one change.

## Before you start

- Use PHP 8.2+ and a Laravel major supported by the package (see `composer.json` and CI).
- Read `readme.md` for install basics.
- Host contracts and upgrade details live in `UPGRADE.md`.
- Search for existing patterns before adding a new layer or abstraction.
- Translations go under `resources/lang`.

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

3. To avoid re-publishing frontend assets every time you make a change, symlink the Canvas package build output into your Laravel app instead:

    ```bash
    rm -rf public/vendor/canvas
    ln -s "$(cd .. && pwd)/canvas/resources/dist" public/vendor/canvas
    ```

    Package builds land in `resources/dist` (including `assets`, `manifest.json`, and the `canvas.hot` file from the Vite dev server). Hosts still serve them from `public/vendor/canvas` after publish or this symlink.

4. From the Canvas package directory, start the Vite dev server:

    ```bash
    npm install
    npm run dev
    ```

    Canvas uses Laravel's Vite integration: the package writes builds to `resources/dist`, while production base URLs stay `/vendor/canvas/...` so they match the host publish path. Running `npm run dev` starts the dev server and writes `resources/dist/canvas.hot` — that file tells Canvas to serve assets from the dev server rather than the production build. For a production-style build, run `npm run build` instead.

5. Adjust `/canvas` if your folder layout is different.

## Before opening a pull request

- Run `npm run typecheck`, `npm run lint`, and `npm test`
- Run `npm run build` and commit updated assets in `resources/dist`
- Run `composer pint` (or `composer pint:test` to check without fixing)
- Run `composer lint` (PHPStan)
- Run `composer test:ci` to match the PHP matrix locally

Once you've made your changes, create a pull request from your fork to the `develop` branch of the project repository.

## Before a release

- Run the full quality gate: `composer pint:test`, `composer lint`, `composer test:ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when SPA assets change
- Regenerate coverage once with `composer test:coverage` (or `test:coverage:html`) and do not claim percentages without a fresh run
- Smoke the admin SPA on a path install: install → grant access → draft/schedule/publish → pending promote/discard → Organize taxonomy → media upload/delete → roles → integrations
- Keep locale key sets in lockstep with `resources/lang/en` (enforced by `LocalizationTest`). New `en` keys must be added to every other locale file — English placeholders are fine until a proper translation lands
