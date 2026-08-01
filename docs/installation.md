# Installation

## Requirements

Canvas requires PHP 8.3+ and Laravel 12 or 13. Your application must already provide authentication for the guard Canvas will use (`web` by default).

Canvas reads `id`, `name`, and `email` from your user model and expects a stock Laravel **bigint** primary key. It does not create users or own login routes.

## Installing Canvas

You may install Canvas via Composer:

```bash
composer require austintoddj/canvas
php artisan canvas:install
```

The `canvas:install` command runs migrations, publishes admin assets to `public/vendor/canvas`, and links public storage.

Next, grant admin access to an existing user and visit `/canvas` while signed in:

```bash
php artisan canvas:make-admin your@email.com
```

## Configuration

If you need to customize defaults, publish the configuration file:

```bash
php artisan vendor:publish --tag=canvas-config
```

See [configuration](./configuration.md).

## Optional steps

You may add the `HasCanvasAccess` trait to your user model for convenient relationships and role helpers. It is not required for the admin to work. See [authorization](./authorization.md).

To publish a starter public blog, run:

```bash
php artisan canvas:ui
```

See [Canvas UI](./canvas-ui.md).

## Updating

After Composer updates, republish assets:

```bash
composer update austintoddj/canvas
php artisan canvas:publish
```

You may automate this in your application's `composer.json`:

```json
{
    "scripts": {
        "post-update-cmd": ["@php artisan canvas:publish --ansi"]
    }
}
```

## Artisan commands

| Command                            | Description                                    |
| ---------------------------------- | ---------------------------------------------- |
| `canvas:install`                   | Migrate, publish assets, link storage          |
| `canvas:migrate`                   | Run package migrations                         |
| `canvas:publish`                   | Publish admin assets                           |
| `canvas:make-admin {user}`         | Grant Admin access                             |
| `canvas:assign-role {user} {role}` | Assign Contributor, Editor, or Admin           |
| `canvas:remove-access {user}`      | Remove Canvas access                           |
| `canvas:users`                     | List or inspect Canvas users                   |
| `canvas:roles`                     | List roles                                     |
| `canvas:ui`                        | Publish the optional reader                    |
| `canvas:digest`                    | Send the weekly digest                         |
| `canvas:announce-scheduled`        | Fire `PostPublished` when schedules elapse     |
| `canvas:prune-post-revisions`      | Keep newest N version-history rows per post    |
| `canvas:prune-webhook-deliveries`  | Delete old outbound webhook delivery rows      |

The `{user}` argument accepts an email address or user ID.
