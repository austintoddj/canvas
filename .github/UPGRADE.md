# Upgrade Guide

## Table of Contents

- [Upgrading to 7.0.0 from 6.0](#upgrading-to-700-from-60)
- [Upgrading to 6.0.0 from 5.4](#upgrading-to-600-from-54)
- [Upgrading to 5.4.0 from 5.3](#upgrading-to-540-from-53)
- [Upgrading to 5.3.0 from 5.2](#upgrading-to-530-from-52)
- [Upgrading to 5.2.0 from 5.1](#upgrading-to-520-from-51)
- [Upgrading to 5.1.0 from 5.0](#upgrading-to-510-from-50)

## Upgrading to 7.0.0 from 6.0

> **Important:** Canvas 7.0 is a **breaking release**.

If you previously ran an older version of Canvas:

1. Back up anything you still need outside the database (markdown exports, media files, etc.).
2. Drop all `canvas_*` tables and remove Canvas rows from the host `migrations` table (or use a fresh database).
3. Install Canvas 7 as a **new** install — follow [docs/installation.md](../docs/installation.md).

Do not expect prior `canvas_users` rows, passwords, soft-deletes, multi-topic pivots, or Canvas-owned auth routes to carry forward. Re-grant access with `canvas:make-admin` / `canvas:assign-role` and recreate content as needed.

```bash
composer require austintoddj/canvas:^7.0
# or, if already required:
composer update austintoddj/canvas

php artisan canvas:install
# or: php artisan canvas:migrate && php artisan canvas:publish

php artisan canvas:make-admin your@email.com
```

If an older install left `App\Providers\CanvasServiceProvider` (or a providers entry for it), delete it — package registration is automatic via Composer discovery.

### Breaking changes (6 → 7)

#### Routes and authentication

- No Canvas login, logout, or password-reset routes — use the host app.
- Protected routes use `auth:{guard}`, then Canvas user eager-load + **Authorize**. Users without a `canvas_users` row receive **403**.
- Admin authorization uses Laravel gates and `can:` middleware (not a Canvas `Admin` middleware class).
- Access is a `canvas_users` row linked to the host user — not Canvas-owned accounts. Details: [docs/authorization.md](../docs/authorization.md).

#### Artisan commands

| Command | Purpose |
| ------- | ------- |
| `canvas:make-admin {user}` | Grant or promote to Admin |
| `canvas:assign-role {user} {role}` | Assign Contributor, Editor, or Admin |
| `canvas:remove-access {user}` | Delete the `canvas_users` row (host untouched) |
| `canvas:users` / `canvas:users {user}` | List access or dump one profile as JSON |
| `canvas:migrate` | Run package schema migrations |
| `canvas:publish` | Publish admin assets |
| `canvas:install` | First-time install helper |
| `canvas:digest` | Weekly author digest (when mail enabled) |
| `canvas:ui` | Optional sample reader views |

All `{user}` arguments accept an email address or host user ID. Full list: [docs/installation.md](../docs/installation.md).

#### Models and schema

- Identity is the host user model; optionally add `HasCanvasAccess` for a `canvasUser` relationship ([docs/authorization.md](../docs/authorization.md)).
- `Canvas\Models\CanvasUser` is the `canvas_users` row (role, profile, preferences).
- `Post`, `Tag`, and `Topic` `user()` relationships resolve to the host user model.
- Host foreign keys use **stock Laravel bigint**. Content primary keys (posts, tags, topics, media) remain UUIDs.
- Posts have a single `topic_id` FK (no multi-topic pivot).
- **Custom host key types** or a non-`users` host table → fork the package migration once.

#### Publishing model

- **Drafts and scheduled posts** — autosave writes the row directly.
- **Live posts** — autosave writes `pending` JSON only so the public snapshot stays stable.
- **Update** (`promote: true`) — merges pending into the live snapshot.
- **Discard** — clears pending; live columns unchanged.
- Public / host readers must use live columns only — **never** `pending`.
- Domain events and outbound webhooks fire only on **public snapshot** mutations.

Details: [docs/content.md](../docs/content.md).

#### Events and webhooks

- `PostViewed` manual dispatches require request context (`ip`, `agent`, `referer`).
- Lifecycle domain events: `PostPublished`, `PostScheduled`, `PostUpdated`, `PostUnpublished`, `PostDeleted`.
- Outbound webhooks (Integrations UI): signed HTTPS deliveries; payload has metadata, not full HTML body.

Details: [docs/webhooks.md](../docs/webhooks.md).

#### API / boot payload

- `UserResource` nests Canvas fields under `canvas`; top-level `id` is the host user PK.
- Role integers: `1` Contributor, `2` Editor, `3` Admin.
- Theme: `system` / `light` / `dark`.
- Media on the public disk uses root-relative `/storage/...` paths; remote URLs stay absolute.

#### Configuration and integrations

- Config keys and env: [docs/configuration.md](../docs/configuration.md).
- Unsplash, AI, and webhooks are admin Integrations settings (encrypted secrets in `canvas_settings`).
- Weekly digest: `CANVAS_MAIL_ENABLED`; package schedules `canvas:digest` Mondays 08:00 — host must run the scheduler and a queue worker unless `sync`.

#### Support window

Canvas 7 requires PHP 8.3+ and Laravel 12 or 13. Laravel 11 and PHP 8.2 are not supported. Treat `composer.json` and `.github/workflows/tests.yml` as the live source of truth.

## Upgrading to 6.0.0 from 5.4

> **Important:** With the release of Laravel 8 and the introduction of the legacy-factories package, Canvas _no longer
> supports_ PHP <= 7.2. It does however continue to support Laravel 6/7/8 and PHP >= 7.3

### Database (Export)

The `canvas_user_meta` table has been removed in v6.0.0, and a new table: `canvas_users` will take its place. Canvas
will no longer rely on the default `users` table, or allow you to specify your own user model. This shift mimics the
underlying structure of WordPress and similar apps.

> Note: The process for migrating data will be unique based on your choice of IDE and database.

The first step is to export all data in Canvas-related tables to a SQL dump. The important part of this step is to make
sure your export does **not include** the table structure. You only want INSERT statements in the actual export
. _If you do include CREATE TABLE statements, it'll modify the new tables when importing later_.

For instance, I use [Sequel Pro](http://sequelpro.com/). When I exported my data, I made sure to un-check the
Structure and DROP TABLE syntax elements in the export selection screen.

The following tables need to be included in the export:

- `canvas_posts`
- `canvas_posts_tags`
- `canvas_posts_topics`
- `canvas_tags`
- `canvas_topics`
- `canvas_views`
- `canvas_visits`

Once completed, you can drop those tables from your database.

> Optional: If you want to keep the `migrations` table as minimal as possible, you may delete all references to
> `_canvas` records.

### Updating dependencies

Update your `austintoddj/canvas` dependency to `^6.0` in your `composer.json` file. Upgrade the package to the latest
version:

```bash
composer update
```

### Migrations

Run the new migrations using the `canvas:migrate` Artisan command:

```bash
php artisan canvas:migrate
```

### Database (Import)

You may now import the SQL dump that you created above into your database. Remember, your database and IDE will
determine if you should run into any errors while performing this action.

Once the import is complete, the `user_id` column in the following tables will need to be addressed:

- `canvas_posts`
- `canvas_tags`
- `canvas_topics`

Since those values reflect the user ID from the default `users` table, you'll need to make sure you manually update
those to the correct user IDs when you have them established in `canvas_users`.

### Setting up a user

Since we don't rely on the default `users` table anymore, you'll need create your first user for Canvas. It's really
simple, just run the following Artisan command:

```bash
php artisan canvas:user admin --email {email}
```

That's it! You should jump in right away and update your credentials. Now that you've given yourself Admin access
, you can create new users from the UI. However, the `canvas:user` Artisan command is a handy little tool for
creating users on the fly. You can specify more options like this:

```bash
// Somebody who can write and manage their own posts but cannot publish them
php artisan canvas:user contributor --email {email}

// Somebody who can publish and manage posts including the posts of other users
php artisan canvas:user editor --email {email}

// Somebody who can do everything and see everything
php artisan canvas:user admin --email {email}
```

### Configuration

The base path variable name in `config/canvas.php` changed to be consistent with the newly-added domain variable.
You'll need to make sure your `.env` file is up to date with the correct variable: `CANVAS_PATH`.

Remove the `auth` line from the `middleware` block in `config/canvas.php`.

Remove the entire `user` block from `config/canvas.php`.

### Assets

Re-publish the assets using the `canvas:publish` Artisan command:

```bash
php artisan canvas:publish
```

Clear any cached views using the `view:clear` Artisan command:

```bash
php artisan view:clear
```

## Upgrading to 5.4.0 from 5.3

> **Important:** The package name has changed from `cnvs/canvas` to `austintoddj/canvas`

Update the new `austintoddj/canvas` dependency to `^5.4` in your `composer.json` file. Upgrade the package to the
latest version:

```bash
composer update
```

### Migrations

Run the new migrations using the `migrate` Artisan command:

```bash
php artisan migrate
```

### Assets

Re-publish the assets using the `canvas:publish` Artisan command:

```bash
php artisan canvas:publish
```

Clear any cached views using the `view:clear` Artisan command:

```bash
php artisan view:clear
```

## Upgrading to 5.3.0 from 5.2

> **Note:** The `5.3.0` minor update contains does not contain breaking changes.

### Updating dependencies

Update your `cnvs/canvas` dependency to `^5.3` in your `composer.json` file. Upgrade the package to the latest version:

```bash
composer update
```

### Assets

Re-publish the assets using the `canvas:publish` Artisan command:

```bash
php artisan canvas:publish
```

Clear any cached views using the `view:clear` Artisan command:

```bash
php artisan view:clear
```

## Upgrading to 5.2.0 from 5.1

> **Important:** The `Canvas\Http\Middleware\ViewThrottle` middleware was renamed to `Canvas\Http\Middleware
\Session`. Update any usages of this class.

> **Important:** The `meta` field for posts will now only support a title, description, and canonical link. The
> `og_*` and `twitter_*` tags were unnecessarily specific, so they were deprecated. If you use those tags in your
> frontend templates, simply update them with the new title and description fields.

### Updating dependencies

Update your `cnvs/canvas` dependency to `^5.2` in your `composer.json` file. Upgrade the package to the latest version:

```bash
composer update
```

### Migrations

Run the new migrations using the `migrate` Artisan command:

```bash
php artisan migrate
```

### Assets

Re-publish the assets using the `canvas:publish` Artisan command:

```bash
php artisan canvas:publish
```

Clear any cached views using the `view:clear` Artisan command:

```bash
php artisan view:clear
```

## Upgrading to 5.1.0 from 5.0

### Updating dependencies

Update your `cnvs/canvas` dependency to `^5.1` in your `composer.json` file. Upgrade the package to the latest version:

```bash
composer update
```

### Configuration

Add the following line to the Storage block in your `config/canvas.php` file:

```php
'upload_filesize' => env('CANVAS_UPLOAD_FILESIZE', 3145728),
```

Rename the Weekly Digest configuration variable:

> Note: Make sure that you update your `.env` file as well to reflect this variable change

```php
'mail' => [
    'enabled' => env('CANVAS_MAIL_ENABLED', false),
],
```

### Service Provider

Update the `boot()` method in your `app/Providers/CanvasServiceProvider.php` file:

```php
$this->app->booted(function () {
    $schedule = resolve(Schedule::class);
    $schedule->command('canvas:digest')
        ->weekly()
        ->mondays()
        ->timezone(config('app.timezone'))
        ->at('08:00')
        ->when(function () {
            return config('canvas.mail.enabled');
        });
});
```

### Migrations

Run the new migrations using the `migrate` Artisan command:

```bash
php artisan migrate
```

### Assets

Re-publish the assets using the `canvas:publish` Artisan command:

```bash
php artisan canvas:publish
```

Clear any cached views using the `view:clear` Artisan command:

```bash
php artisan view:clear
```
