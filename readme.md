<p align="center">
    <a href="https://trycanvas.app">
        <img src=".github/docs/readme.png" alt="Homepage for trycanvas.app">
    </a>
</p>

<p align="center">
    <a href="https://github.com/austintoddj/canvas/actions"><img src="https://github.com/austintoddj/canvas/workflows/tests/badge.svg" alt="Build Status"></a>
    <a href="https://packagist.org/packages/austintoddj/canvas"><img src="https://img.shields.io/packagist/dt/austintoddj/canvas" alt="Total Downloads"></a>
    <a href="https://packagist.org/packages/austintoddj/canvas"><img src="https://img.shields.io/packagist/v/austintoddj/canvas" alt="Latest Stable Version"></a>
    <a href="https://packagist.org/packages/austintoddj/canvas"><img src="https://img.shields.io/packagist/l/austintoddj/canvas" alt="License"></a>
</p>

## About Canvas

Canvas is an open-source publishing platform for [Laravel](https://laravel.com). Drop it into an existing application, use your own authentication, and start writing.

- Distraction-free editor with tags, topics, and media uploads
- Monthly trends and reader insights
- Contributor, Editor, and Admin roles
- Integrations: Unsplash, AI writing, outbound webhooks, and weekly digest
- Optional starter reader frontend via `canvas:ui`

Canvas reads identity from your application's user model and stores author profiles and access in `canvas_users`. Configuration lives in `config/canvas.php` after install.

## Requirements

- PHP >= 8.3
- Laravel >= 12
- Working authentication for the guard Canvas uses (`web` by default)

## Installation

```bash
composer require austintoddj/canvas
php artisan canvas:install
php artisan storage:link
```

Sign in to your application, then grant yourself access:

```bash
php artisan canvas:make-admin your@email.com
```

Visit `/canvas`.

## Optional Frontend

Use the `canvas:ui` Artisan command to publish a starter reader frontend — Blade views, a controller stub, and routes. It gets you a public blog at `/canvas-ui` without building one from scratch. Customize whatever you like!

```bash
php artisan canvas:ui
```

Add `require __DIR__.'/canvas-ui.php';` to `routes/web.php`. Published views live in `resources/views/vendor/canvas/ui/`.

## Upgrading

Canvas follows [Semantic Versioning](https://semver.org) and increments versions as `MAJOR.MINOR.PATCH`.

- **Major** versions may contain breaking changes — follow the [upgrade guide](.github/UPGRADE.md) for a step-by-step breakdown.
- **Minor** and **patch** versions should never contain breaking changes, so you can safely update by following the steps below.

```bash
composer update austintoddj/canvas
php artisan canvas:publish
```

To publish assets automatically after Composer updates, add this to your application’s `composer.json`:

```json
{
    "scripts": {
        "post-update-cmd": ["@php artisan canvas:publish --ansi"]
    }
}
```

## Contributing

Thank you for considering contributing to Canvas! The [contribution guide can be found here](https://github.com/austintoddj/canvas/blob/main/.github/CONTRIBUTING.md).

## Testing

```bash
composer test
```

## License

Canvas is open-sourced software licensed under the [MIT license](license).
