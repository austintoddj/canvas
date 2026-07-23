# Contributing Guide

Thank you for considering a contribution to Canvas.

If you're fixing docs, translations, bugs, or features, please open a pull request and keep it focused on one change.

## Before you start

- Use PHP 8.2+ and a Laravel major supported by the package (see `composer.json` and CI).
- CI runs JavaScript checks on **Node 22** — match that locally when possible.
- Read `readme.md` for install basics.
- Host contracts, clean-break install, and the support matrix live in [`UPGRADE.md`](UPGRADE.md).
- Search for existing patterns before adding a new layer or abstraction.
- Translations go under `resources/lang` (see [Language catalog](#language-catalog) below).
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Security vulnerabilities: report privately per [`SECURITY.md`](SECURITY.md) — do not open public issues for vulns.

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
- Run `npm run build` and **commit** updated assets in `resources/dist` — hosts serve published package assets; CI does not rebuild dist for them
- Run `composer pint` (or `composer pint:test` to check without fixing)
- Run `composer lint` (PHPStan)
- Run `composer test:ci` to match the PHP matrix locally

Once you've made your changes, create a pull request from your fork to the `develop` branch of the project repository. For large majors, work may land on a version branch (e.g. `v7`) first; open PRs against the branch maintainers are merging, defaulting to `develop` unless the issue or PR says otherwise.

## Language catalog

UI copy lives under `resources/lang`. **A feature that introduces or changes UI strings is not complete until the full catalog is updated.**

| Rule                        | Detail                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source of truth**         | `resources/lang/en/app.php`                                                                                                                           |
| **Every other locale**      | Same key set as `en` — no missing keys, no extra keys                                                                                                 |
| **New / updated keys**      | Add or update the key in **every** `resources/lang/{locale}/app.php` with a **real translation** for that language — not a copy of the English string |
| **Allowed English overlap** | Only true cognates, loanwords, brands, or identical short words (e.g. `SEO`, `URL`, `API`, `Unsplash`, `Canvas`, `Avatar`, `OK`)                      |
| **Removed / renamed keys**  | Apply in **every** locale file in the same change                                                                                                     |
| **Proof**                   | `composer test -- --filter=LocalizationTest` must pass (key parity). Also spot-check that new strings are not English clones in non-`en` files        |

Do not leave English placeholders or “translate later” TODOs for other locales.

## Before a release

- Run the full quality gate: `composer pint:test`, `composer lint`, `composer test:ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when SPA assets change
- Regenerate coverage once with `composer test:coverage` (or `test:coverage:html`) and do not claim percentages without a fresh run
- Smoke the admin SPA on a path install: install → grant access → draft/schedule/publish → pending promote/discard → Organize taxonomy → media upload/delete → roles → integrations
- Finish the [language catalog](#language-catalog) for any UI copy changes — key parity alone is not enough
