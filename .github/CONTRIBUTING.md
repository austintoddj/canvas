# Contribution Guide

Thank you for considering contributing to Canvas.

Please read the [code of conduct](CODE_OF_CONDUCT.md). If you discover a security vulnerability, report it privately as described in [SECURITY.md](SECURITY.md) — do not open a public issue.

## Bug reports

When filing a bug, include a clear title, a short description, and enough detail for someone else to reproduce the problem. A small code sample or steps in a host Laravel app are especially helpful.

Pull requests are welcome and preferred when you already have a fix. Keep each pull request focused on one change.

## Which branch?

Open pull requests against the `develop` branch unless an issue or maintainer asks you to use another branch (for example a version branch during a major release).

## Local development

Canvas is a package, not a full application. To work on it locally, use a Laravel app with a sibling checkout of this repository.

From your Laravel application, register the path repository and require Canvas:

```bash
composer config repositories.canvas '{"type": "path", "url": "../canvas"}' --file composer.json
composer require austintoddj/canvas @dev
php artisan canvas:install
```

Symlink the package build into your app so you do not need to republish assets on every change:

```bash
rm -rf public/vendor/canvas
ln -s "$(cd .. && pwd)/canvas/resources/dist" public/vendor/canvas
```

From the Canvas package directory, install JavaScript dependencies and start Vite when working on the admin SPA:

```bash
npm install
npm run dev
```

Use PHP 8.3+ and a Laravel major supported by the package (`composer.json` and CI). Node 22 matches CI for JavaScript checks.

Host installation and usage are documented under [`docs/`](../docs/).

## Pull requests

Before submitting a pull request, please:

1. Run the test suite and static checks that apply to your change.
2. If you changed the admin SPA, run `npm run build` and **commit** the updated files in `resources/dist`. Hosts serve those published assets; CI does not rebuild them for consumers.
3. If you changed host-facing behavior, update the matching page under [`docs/`](../docs/).
4. If you changed UI copy, update every language file (see [translations](#translations)).

Useful commands from the package root:

```bash
composer pint
composer lint
composer test

npm run typecheck
npm run lint
npm test
npm run build
```

## Translations

UI strings live in `resources/lang/{locale}/app.php`. English (`en`) is the source of truth.

When you add or change a string:

- Update `en` first, then every other locale with the same keys.
- Use a real translation for each language — not a copy of the English text (except true cognates and brand names such as `SEO`, `Canvas`, or `Unsplash`).
- Remove or rename keys in every locale in the same change.

You may verify key parity with:

```bash
composer test -- --filter=LocalizationTest
```

## Coding style

PHP is formatted with [Laravel Pint](https://laravel.com/docs/pint). Match the patterns already used in neighboring controllers, pages, and tests rather than introducing new layers or abstractions without precedent.
