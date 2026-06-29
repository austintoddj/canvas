# Upgrade Guide

## Table of Contents

- [Upgrading to 7.0.0 from 6.x](#upgrading-to-700-from-6x)
- [Upgrading to 6.0.0 from 5.4](#upgrading-to-600-from-54)
- [Upgrading to 5.4.0 from 5.3](#upgrading-to-540-from-53)
- [Upgrading to 5.3.0 from 5.2](#upgrading-to-530-from-52)
- [Upgrading to 5.2.0 from 5.1](#upgrading-to-520-from-51)
- [Upgrading to 5.1.0 from 5.0](#upgrading-to-510-from-50)

## Upgrading to 7.0.0 from 6.x

> **Important:** v7 is a breaking release. Canvas no longer ships its own login/password-reset flow or a Canvas-owned auth guard. The package now uses the host application's `User` model for identity and stores Canvas-specific access in `canvas_users`.

### What changed

- Removed `canvas/login`, `canvas/logout`, `canvas/forgot-password`, and `canvas/reset-password` routes.
- Removed the `canvas:user` command in favor of:
    - `canvas:make-admin {user}`
    - `canvas:assign-role {user} {role}`
    - `canvas:remove-access {user}`
    - `canvas:list-users`
- Removed `Canvas\Http\Middleware\Authenticate`; Canvas now uses native Laravel auth middleware (`auth:{guard}`).
- Removed `Canvas\Http\Middleware\Admin`; Canvas now uses Laravel gate/policy authorization via `can:` middleware.
- Replaced the package `User` model with `Canvas\Models\CanvasUser` for role metadata.
- Added configurable `canvas.user_model` and `canvas.guard` settings.
- **`PostViewed` constructor signature changed.** The event now requires `ip`, `agent`, and `referer` in addition to `post`. If you fire the event manually in a custom controller, update your call:

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

### Before upgrading

1. Make sure your host application already has a working authentication system and a login route.
2. Decide which host user model Canvas should use (defaults to `App\Models\User`).
3. Update any automation or scripts that still call `canvas:user` or rely on Canvas password reset routes.

### Database changes

- `canvas_users` now uses `user_id` as its primary key.
- `canvas_users` no longer stores password, email, remember token, or soft-delete data.
- `canvas_users.preferences` (JSON column) has been replaced by two boolean columns: `dark_mode` and `digest` (both default `false`).
- Canvas-authored content now allows `user_id` to be nullable on posts, tags, and topics.
- `canvas_posts_topics` pivot table has been removed; posts now have a `topic_id` foreign key directly on `canvas_posts`.

### Configuration changes

Add or confirm the following settings:

```php
'user_model' => env('CANVAS_USER_MODEL', App\Models\User::class),
'guard' => env('CANVAS_GUARD', 'web'),
'middleware' => ['web'],
```

Canvas automatically applies `auth:{guard}` to protected routes and uses Laravel `can:` middleware for role-based access. Your host app must own login/logout/password reset flows for that guard.

### Post-upgrade

- Recreate any Canvas admins using `canvas:make-admin`.
- Reassign users with `canvas:assign-role`.
- Remove access with `canvas:remove-access`.
- Use `canvas:list-users` to confirm roles.

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
