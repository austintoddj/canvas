# Upgrade Guide

## Table of Contents

- [Upgrading to 7.0.0 from 6.x](#upgrading-to-700-from-6x)
- [Upgrading to 6.0.0 from 5.4](#upgrading-to-600-from-54)
- [Upgrading to 5.4.0 from 5.3](#upgrading-to-540-from-53)
- [Upgrading to 5.3.0 from 5.2](#upgrading-to-530-from-52)
- [Upgrading to 5.2.0 from 5.1](#upgrading-to-520-from-51)
- [Upgrading to 5.1.0 from 5.0](#upgrading-to-510-from-50)

## Upgrading to 7.0.0 from 6.x

> **Important:** v7 is a breaking release. Canvas no longer ships its own login/password-reset flow or a Canvas-owned auth guard. The package now uses the host application's `User` model for **read-only identity** (`id`, `name`, `email`) and stores all Canvas profile, preferences, and access in `canvas_users`. **Canvas never writes to host user tables.**

### Architecture

| Concern | Owner |
|---------|-------|
| Authentication (login, password reset, sessions) | Host application |
| Identity (`id`, `name`, `email`) | Host `users` table (read-only from Canvas) |
| Canvas access (role), author profile, UI prefs | `canvas_users` table |
| Posts, tags, topics `user_id` | Host `users.id` (foreign key) |

Canvas resolves the host user model via `config('canvas.user_model')` (default `App\Models\User`). Add the optional `Canvas\Concerns\HasCanvasAccess` trait to that model for the `canvasUser` relationship, content relations (`posts`, `tags`, `topics`), and convenience accessors (`username`, `isAdmin`, etc.). Without the trait, Canvas still works — middleware falls back to querying `canvas_users` directly.

### Prerequisites

Before upgrading, confirm:

1. Your host application has a working authentication system and login route for the guard Canvas will use (default `web`).
2. You know which host user model Canvas should resolve (`CANVAS_USER_MODEL`, default `App\Models\User`).
3. Every person who needs Canvas access already exists as a row in the host `users` table (Canvas grants access; it does not create host accounts).
4. Any automation that calls `canvas:user` or relies on Canvas password-reset routes has been updated.

### Upgrade checklist

1. Update the package:

    ```bash
    composer update austintoddj/canvas
    ```

2. Publish the updated config (if you have not customized it yet, compare your published file with the package default):

    ```bash
    php artisan vendor:publish --tag=canvas-config
    ```

3. Add `HasCanvasAccess` to your host user model (recommended):

    ```php
    use Canvas\Concerns\HasCanvasAccess;

    class User extends Authenticatable
    {
        use HasCanvasAccess;
    }
    ```

4. Run migrations:

    ```bash
    php artisan canvas:migrate
    ```

5. Migrate v6 user data into the new schema (see [v6 migration scenarios](#v6-migration-scenarios) below). There is no `canvas:migrate-users` command yet — this step is manual.

6. Re-publish assets:

    ```bash
    php artisan canvas:publish
    php artisan view:clear
    ```

7. Grant Canvas access to your team:

    ```bash
    php artisan canvas:make-admin your@email.com
    php artisan canvas:assign-role editor@example.com editor
    php artisan canvas:list-users
    ```

8. Smoke-test `/canvas` while signed in as a user with a `canvas_users` row.

### Breaking changes

#### Routes and authentication

- Removed `canvas/login`, `canvas/logout`, `canvas/forgot-password`, and `canvas/reset-password` routes.
- Removed `Canvas\Http\Middleware\Authenticate`; Canvas uses native `auth:{guard}` middleware.
- Removed `Canvas\Http\Middleware\Admin`; Canvas uses Laravel gates and `can:` middleware.
- Protected routes run `EagerLoadCanvasUser` then `Authorize` (in that order). Users without a `canvas_users` row receive **403**.

#### Artisan commands

- Removed `canvas:user`. Use:
    - `canvas:make-admin {user}` — grant or promote to Admin
    - `canvas:assign-role {user} {role}` — assign Contributor, Editor, or Admin
    - `canvas:remove-access {user}` — delete the `canvas_users` row (host user is untouched)
    - `canvas:list-users` — list users with Canvas access
    - `canvas:show-user {user}` — dump the full Canvas profile as JSON

All `{user}` arguments accept an email address or host user ID.

#### Models

- **Removed** `Canvas\Models\User`. Use your host user model with the `canvasUser` relationship.
- **Added** `Canvas\Models\CanvasUser` for the `canvas_users` table (role, profile, preferences).
- `Post`, `Tag`, and `Topic` `user()` relationships resolve to the host user model.

#### `PostViewed` event

The constructor now requires request context. Update any manual dispatches:

```php
// Before (v6)
event(new Canvas\Events\PostViewed($post));

// After (v7)
event(new Canvas\Events\PostViewed(
    post: $post,
    ip: request()->ip(),
    agent: request()->userAgent(),
    referer: request()->header('referer'),
));
```

#### API and frontend boot payload

`UserResource` is the contract for user endpoints and the SPA boot payload. Shape:

```json
{
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar_url": "https://…",
    "posts_count": 12,
    "canvas": {
        "role": 3,
        "username": "jane",
        "summary": "…",
        "avatar": "hash-or-url",
        "avatar_url": "https://…",
        "website": "https://example.com",
        "social": { "twitter": "jane" },
        "locale": "en",
        "timezone": "America/Chicago",
        "dark_mode": false,
        "digest": true,
        "preferences": {
            "onboarding": { "complete": false }
        }
    }
}
```

Key differences from v6:

- Top-level `avatar_url` is always present (custom avatar or Gravatar fallback from host email).
- Canvas-specific fields live under nested `canvas` (only when `canvasUser` is eager-loaded).
- `role` is an integer enum: `1` Contributor, `2` Editor, `3` Admin.
- `POST /api/users/{id}` upserts profile data via `SyncCanvasUser`; initial grant requires a `role` when no `canvas_users` row exists.

Update any custom frontends or TypeScript types that assumed a flat user object.

#### Database

- `canvas_users.user_id` is the primary key and foreign key to `users.id`.
- `canvas_users` no longer stores `password`, `email`, `remember_token`, or soft-delete columns.
- `canvas_posts_topics` pivot removed; `canvas_posts.topic_id` is a direct foreign key.
- `user_id` on posts, tags, and topics is nullable and references `users.id`.

### `canvas_users` schema

Hybrid storage: typed columns for queryable fields; `preferences` JSON for long-tail UI settings.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid, PK, FK → `users.id` | Cascade delete with host user |
| `role` | tinyint | `1` Contributor, `2` Editor, `3` Admin |
| `username` | string, nullable, unique | Public author handle |
| `summary` | text, nullable | Author bio |
| `avatar` | string, nullable | Gravatar hash or full URL |
| `website` | string, nullable | |
| `social` | json, nullable | Key/value social links |
| `locale` | string, nullable | Must be in available locales |
| `timezone` | string, nullable | IANA timezone; used by `canvas:digest` |
| `dark_mode` | boolean, default `false` | UI preference |
| `digest` | boolean, default `false` | Weekly email opt-in |
| `preferences` | json, nullable | Merged with defaults; `onboarding.complete` today |
| `created_at` / `updated_at` | timestamps | |

### Configuration

Confirm these settings in `config/canvas.php`:

```php
'user_model' => env('CANVAS_USER_MODEL', 'App\Models\User'),
'guard' => env('CANVAS_GUARD', 'web'),
'middleware' => ['web'],
'locales' => ($locales = env('CANVAS_LOCALES')) ? array_values(array_filter(array_map('trim', explode(',', $locales)))) : [],
```

- **`user_model`** — host Eloquent class Canvas reads identity from.
- **`guard`** — applied as `auth:{guard}` on all Canvas routes.
- **`middleware`** — additional middleware (e.g. `web`) applied before auth.
- **`locales`** — optional comma-separated restriction (`CANVAS_LOCALES=en,es`). Canvas discovers locales from package and published translation directories; codes without translation files are ignored.

Your host app owns login, logout, and password reset for the configured guard.

### Access model

Canvas access is a row in `canvas_users`, not a flag on the host user:

- **Grant** — `canvas:make-admin` / `canvas:assign-role`, or `POST /api/users/{id}` with a `role` (admin-only for role changes).
- **Revoke** — `canvas:remove-access` or `DELETE /api/users/{user}` (admin-only; cannot delete yourself).
- **Authorize** — every Canvas route requires an authenticated user with a `canvas_users` row.

`canvas:remove-access` and `UserController@destroy` only delete `canvas_users`. Host `users` rows and authored content are preserved; posts retain their `user_id`.

### v6 migration scenarios

There is no automated `canvas:migrate-users` command. Choose the path that matches your v6 setup.

#### Scenario A — v6 Canvas was your only user store

In v6, `canvas_users` held email, password, and profile data. In v7, those accounts must exist in the host `users` table first.

1. Export v6 `canvas_users` data (email, name, username, summary, avatar, role, preferences).
2. Create matching rows in host `users` (preserve or map IDs if possible).
3. Insert `canvas_users` rows with the new schema, mapping `user_id` to host `users.id`:

    ```sql
    INSERT INTO canvas_users (user_id, role, username, summary, avatar, locale, timezone, dark_mode, digest, preferences, created_at, updated_at)
    SELECT … FROM your_v6_export;
    ```

4. Verify `canvas_posts.user_id`, `canvas_tags.user_id`, and `canvas_topics.user_id` still reference valid host `users.id` values. Re-point any orphaned IDs after host user creation.

#### Scenario B — v6 `canvas_users` alongside an existing Laravel `users` table

If v6 `canvas_users.id` already matched host `users.id`, migration is simpler:

1. Run `canvas:migrate` to reshape `canvas_users`.
2. Copy profile columns from your v6 export into the new columns (`username`, `summary`, `avatar`, etc.).
3. Map v6 JSON `preferences` into the hybrid schema: extract `dark_mode` and `digest` into their boolean columns; keep remaining keys in `preferences`.
4. Drop v6-only columns (`email`, `password`, `remember_token`, `deleted_at`) after data is verified.

#### Scenario C — fresh install on an existing Laravel app

No data migration needed. Run `canvas:migrate`, sign in, then `canvas:make-admin`.

### Post-upgrade verification

```bash
php artisan canvas:list-users
php artisan canvas:make-admin your@email.com   # if needed
```

1. Sign in via your host app's login flow.
2. Visit `/canvas` — expect the admin SPA, not 403.
3. Open browser devtools and confirm boot payload includes `user.avatar_url` and `user.canvas`.
4. If using weekly digests, confirm `canvas:digest` is scheduled and users with `digest: true` have a valid `timezone`.
5. If you have a custom frontend, confirm `PostViewed` dispatches include request context.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| 403 on `/canvas` after login | No `canvas_users` row for the authenticated user | `canvas:make-admin` or `canvas:assign-role` |
| 403 with valid session | Wrong guard | Set `CANVAS_GUARD` to your app's guard |
| `User` has no `canvasUser` relation | Trait not added | Add `HasCanvasAccess` to host user model |
| Locale validation fails on save | Locale not translated | Publish lang files or restrict `CANVAS_LOCALES` to available codes |
| FK error on `canvas_users.user_id` | Host user does not exist | Create the host user first, then grant Canvas access |
| Posts show wrong author | `user_id` still points at old v6 IDs | Re-map `canvas_posts.user_id` to host `users.id` |
| Flat user object in custom code | API shape changed | Read `avatar_url` and nested `canvas` from `UserResource` |

### Weekly digest

`canvas:digest` respects each user's `timezone` on `canvas_users` when computing the reporting window (`DigestPeriod`). The command still runs on your scheduler's cadence (weekly by default when `canvas.mail.enabled` is true); per-user timezone affects which posts fall in the digest window, not when the scheduler fires.

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
