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

    To avoid re-publishing frontend assets every time you make a change, symlink the package's public directory into your Laravel app instead:

    ```bash
    rm -rf public/vendor/canvas/*
    cd public/vendor/canvas
    ln -s ../../../../canvas/public/* .
    ```

3. Adjust `../canvas` if your folder layout is different.

## Before opening a pull request

- Run `composer test`
- Run `composer test:parallel` when you want to match CI.
- Run `composer pint` before pushing.

Once you've made your changes, create a pull request from your fork to the `develop` branch of the project repository.
