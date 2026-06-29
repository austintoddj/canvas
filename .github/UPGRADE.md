# Upgrade Guide

## Table of Contents

- [Upgrading to 7.0.0 from 6.x](#upgrading-to-700-from-6x)
    - [Optional: `HasCanvasAccess`](#optional-hascanvasaccess)
    - [v6 migration scenarios](#v6-migration-scenarios)
    - [Detect your scenario](#detect-your-scenario)
    - [`canvas:migrate`](#canvasmigrate)
    - [Migrate topics from `canvas_posts_topics`](#migrate-topics-from-canvas_posts_topics)
    - [Post-upgrade verification](#post-upgrade-verification)
- [Upgrading to 6.0.0 from 5.4](#upgrading-to-600-from-54)
- [Upgrading to 5.4.0 from 5.3](#upgrading-to-540-from-53)
- [Upgrading to 5.3.0 from 5.2](#upgrading-to-530-from-52)
- [Upgrading to 5.2.0 from 5.1](#upgrading-to-520-from-51)
- [Upgrading to 5.1.0 from 5.0](#upgrading-to-510-from-50)

## Upgrading to 7.0.0 from 6.x

> **Important:** v7 is a breaking release. Canvas no longer ships its own login/password-reset flow or a Canvas-owned auth guard. The package now uses the host application's `User` model for **read-only identity** (`id`, `name`, `email`) and stores all Canvas profile, preferences, and access in `canvas_users`. **Canvas never writes to host user tables.**

### Architecture

| Concern                                          | Owner                                      |
| ------------------------------------------------ | ------------------------------------------ |
| Authentication (login, password reset, sessions) | Host application                           |
| Identity (`id`, `name`, `email`)                 | Host `users` table (read-only from Canvas) |
| Canvas access (role), author profile, UI prefs   | `canvas_users` table                       |
| Posts, tags, topics `user_id`                    | Host `users.id` (foreign key)              |

Canvas resolves the host user model via `config('canvas.user_model')` (default `App\Models\User`). It reads `id`, `name`, and `email` from that model and does not write to it. All Canvas access, profile, and preferences live in `canvas_users`. You do not need to change your host `User` model to complete the database upgrade — but see [Optional: `HasCanvasAccess`](#optional-hascanvasaccess) below if you want the usual Laravel integration.

### Optional: `HasCanvasAccess`

Not required for the upgrade itself. Canvas loads profile and access data from `canvas_users` whether or not your host `User` model defines a relationship.

Adding `Canvas\Concerns\HasCanvasAccess` is a nice-to-have that gives your `User` model:

- a `canvasUser` relationship to `canvas_users`
- `posts`, `tags`, and `topics` relationships for authored content
- role accessors (`isAdmin`, `isEditor`, `isContributor`) used by Canvas policies and gates
- profile accessors (`username`, `summary`, `avatar`, `locale`, `darkMode`, `digest`)

```php
use Canvas\Concerns\HasCanvasAccess;

class User extends Authenticatable
{
    use HasCanvasAccess;
}
```

If you skip this, `/canvas` still loads and Canvas still checks access against `canvas_users`. Add the trait when you want those relationships and accessors available on your host `User` model — especially for admin user management, which relies on the `isAdmin` accessor.

### Prerequisites

Before upgrading, confirm:

1. Your host application has a working authentication system and login route for the guard Canvas will use (default `web`).
2. You know which host user model Canvas should resolve (`CANVAS_USER_MODEL`, default `App\Models\User`).
3. Every person who needs Canvas access already exists as a row in the host `users` table (Canvas grants access; it does not create host accounts).
4. Any automation that calls `canvas:user` or relies on Canvas password-reset routes has been updated.

### Upgrade checklist

1. Update your `austintoddj/canvas` dependency to `^7.0` in your `composer.json` file. Upgrade the package to the latest version:

    ```bash
    composer update austintoddj/canvas
    ```

2. Publish the updated config (if you have not customized it yet, compare your published file with the package default):

    ```bash
    php artisan vendor:publish --tag=canvas-config
    ```

3. Upgrade the database — see [v6 migration scenarios](#v6-migration-scenarios).

4. _(Optional)_ Add `HasCanvasAccess` to your host `User` model — see [Optional: `HasCanvasAccess`](#optional-hascanvasaccess).

5. Re-publish assets:

    ```bash
    php artisan canvas:publish
    php artisan view:clear
    ```

6. Run [post-upgrade verification](#post-upgrade-verification).

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

| Column                      | Type                      | Notes                                             |
| --------------------------- | ------------------------- | ------------------------------------------------- |
| `user_id`                   | uuid, PK, FK → `users.id` | Cascade delete with host user                     |
| `role`                      | tinyint                   | `1` Contributor, `2` Editor, `3` Admin            |
| `username`                  | string, nullable, unique  | Public author handle                              |
| `summary`                   | text, nullable            | Author bio                                        |
| `avatar`                    | string, nullable          | Gravatar hash or full URL                         |
| `website`                   | string, nullable          |                                                   |
| `social`                    | json, nullable            | Key/value social links                            |
| `locale`                    | string, nullable          | Must be in available locales                      |
| `timezone`                  | string, nullable          | IANA timezone; used by `canvas:digest`            |
| `dark_mode`                 | boolean, default `false`  | UI preference                                     |
| `digest`                    | boolean, default `false`  | Weekly email opt-in                               |
| `preferences`               | json, nullable            | Merged with defaults; `onboarding.complete` today |
| `created_at` / `updated_at` | timestamps                |                                                   |

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

Upgrading from v6 requires manual schema and data work. Run the [detection queries](#detect-your-scenario), pick the matching scenario, and verify each step before continuing.

#### Before you begin

1. Back up your database.
2. Export `canvas_*` tables if you want a rollback anchor.
3. Run the [detection queries](#detect-your-scenario) and note which scenario applies.

#### Detect your scenario

Run these against your database and keep the output handy.

**1. Has the Canvas migration already run?**

```sql
SELECT migration, batch FROM migrations
WHERE migration = '2020_09_21_000000_create_canvas_tables';
```

If this row exists, Laravel will not re-run the migration after `composer update`. Use the `canvas_users` column check below to see whether schema reshape is still needed.

**2. Is `canvas_users` still on the v6 schema?**

```sql
-- v6 has an `email` column; v7 uses `user_id` as the primary key and has no `email` column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'canvas_users' AND column_name IN ('email', 'user_id');
```

On SQLite, use `PRAGMA table_info(canvas_users);` instead.

**3. Do host users exist and how do they overlap v6 accounts?**

```sql
-- Adjust table/column names if your host user table differs
SELECT
    (SELECT COUNT(*) FROM users) AS host_users,
    (SELECT COUNT(*) FROM canvas_users WHERE deleted_at IS NULL) AS canvas_users,
    (SELECT COUNT(*) FROM canvas_users cu
        INNER JOIN users u ON u.id = cu.id
        WHERE cu.deleted_at IS NULL) AS matching_ids;
```

If `canvas_users` has no `deleted_at` column (v6 often does), drop that predicate.

**4. Does the v6 topics pivot still exist?**

```sql
SELECT COUNT(*) AS pivot_rows FROM canvas_posts_topics;
```

Skip if the table does not exist.

**5. Do content `user_id` values point at real identities?**

```sql
SELECT COUNT(*) AS orphaned_posts
FROM canvas_posts p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;
```

Repeat for `canvas_tags` and `canvas_topics` if needed.

**How to read the results:**

| Signal                                                                                        | Likely scenario                                                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| v6 `canvas_users` schema (`email` column present), few or no host `users`, `matching_ids` ≈ 0 | **Scenario A**                                                                    |
| v6 `canvas_users` schema, host `users` exist, `matching_ids` ≈ `canvas_users`                 | **Scenario B**                                                                    |
| v6 `canvas_users` schema, host `users` exist, `matching_ids` low but emails overlap           | **Scenario A** — map by email, remap `user_id`                                    |
| v7 `canvas_users` schema (`user_id` PK, no `email`)                                           | Schema reshape done — run [post-upgrade verification](#post-upgrade-verification) |
| `pivot_rows` > 0                                                                              | Run the [topics pivot migration](#migrate-topics-from-canvas_posts_topics)        |

#### `canvas:migrate`

v6 and v7 use the same migration file: `2020_09_21_000000_create_canvas_tables`. The file contents changed in v7, but Laravel will not re-run a migration that is already recorded in your `migrations` table. Expect it to show as **Ran** — reshape schema manually per [Scenario A](#scenario-a) or [Scenario B](#scenario-b).

```bash
php artisan migrate:status | grep canvas
```

#### Schema changes at a glance

Content tables (`canvas_posts`, `canvas_tags`, `canvas_topics`, `canvas_posts_tags`, `canvas_views`, `canvas_visits`) keep their row data through a normal upgrade. What changes is **structure** and **what `user_id` points at**.

| Table                            | v6                                                         | v7                                                                      |
| -------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `canvas_users`                   | `id` PK; stores `name`, `email`, `password`, profile       | `user_id` PK → `users.id`; profile/prefs only                           |
| `canvas_posts`                   | `user_id` required; topics via `canvas_posts_topics` pivot | `user_id` nullable → `users.id`; `topic_id` column (one topic per post) |
| `canvas_tags` / `canvas_topics`  | `user_id` required                                         | `user_id` nullable → `users.id`                                         |
| `canvas_posts_topics`            | exists                                                     | **removed** — migrate data to `canvas_posts.topic_id`                   |
| `canvas_posts_tags`              | unchanged                                                  | unchanged                                                               |
| `canvas_views` / `canvas_visits` | unchanged                                                  | unchanged                                                               |

**Data to migrate manually** (v6 upgrades only):

1. `canvas_users` — reshape and map profile data to `user_id`
2. `canvas_posts_topics` — copy one topic per post into `canvas_posts.topic_id` ([steps](#migrate-topics-from-canvas_posts_topics))
3. `canvas_posts`, `canvas_tags`, `canvas_topics` — re-point `user_id` to host `users.id` when IDs change

#### Scenario A

Canvas was your only user store. In v6, `canvas_users` held email, password, and profile data. In v7, identity lives in host `users` and Canvas profile/access lives in `canvas_users`. Create host `users` rows during this upgrade.

**Goal:** Every active v6 account exists in `users`, has a matching `canvas_users` row keyed by `user_id`, and content `user_id` values reference host `users.id`.

**Step 1 — Export v6 accounts**

Export active v6 users (skip soft-deleted rows). At minimum: `id`, `name`, `email`, `password`, `username`, `summary`, `avatar`, `dark_mode`, `digest`, `locale`, `role`, timestamps.

**Step 2 — Create host `users` rows**

For each v6 account, insert into host `users`. **Preserve v6 `id` values when possible** so `canvas_posts.user_id` does not need remapping:

```sql
INSERT INTO users (id, name, email, password, created_at, updated_at)
SELECT id, name, email, password, created_at, updated_at
FROM canvas_users
WHERE deleted_at IS NULL;
```

Adjust columns to match your host user table (`remember_token`, etc.). If a host user already exists for an email but with a different `id`, note the mapping `{v6_id → host_id}` for Step 5.

**Step 3 — Reshape `canvas_users` to v7**

This is the most environment-specific step. Options:

- **Export / reshape / import** — safest for production; build a new `canvas_users` table matching the v7 schema, load transformed data, swap tables.
- **In-place ALTER** — fine for smaller databases; add `user_id`, copy `id` → `user_id`, add new columns, drop v6-only columns.

Target v7 columns: `user_id` (PK), `role`, `username`, `summary`, `avatar`, `website`, `social`, `locale`, `timezone`, `dark_mode`, `digest`, `preferences`, timestamps. See [`canvas_users` schema](#canvas_users-schema) above.

Example mapping from v6 columns:

| v6 column                                                   | v7 destination                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`                                                        | `user_id`                                                                                 |
| `role`                                                      | `role` (default `1` Contributor if null)                                                  |
| `username`, `summary`, `avatar`, `locale`                   | same name                                                                                 |
| `dark_mode`, `digest`                                       | cast to boolean columns                                                                   |
| `email`, `password`, `name`, `remember_token`, `deleted_at` | **drop** — live on host `users` now                                                       |
| —                                                           | `timezone` → default `config('app.timezone')`                                             |
| —                                                           | `website`, `social` → `NULL` unless you have them elsewhere                               |
| —                                                           | `preferences` → `NULL` or `{"onboarding":{"complete":true}}` if users were already active |

**Step 4 — Verify `canvas_users`**

```sql
SELECT COUNT(*) FROM canvas_users cu
LEFT JOIN users u ON u.id = cu.user_id
WHERE u.id IS NULL;
-- expect 0
```

**Step 5 — Remap content `user_id` values (if IDs changed)**

If any v6 `id` maps to a different host `users.id`:

```sql
UPDATE canvas_posts SET user_id = :host_id WHERE user_id = :legacy_id;
UPDATE canvas_tags   SET user_id = :host_id WHERE user_id = :legacy_id;
UPDATE canvas_topics SET user_id = :host_id WHERE user_id = :legacy_id;
```

Re-run the orphaned-post query from [Detect your scenario](#detect-your-scenario).

**Step 6 — Migrate topics** if `canvas_posts_topics` exists (see below).

**Step 7 — Grant access and verify** — `canvas:list-users`, sign in, open `/canvas`.

#### Scenario B

Host `users` already exist and IDs match v6 `canvas_users.id`. Skip host user creation. Focus on reshaping `canvas_users` and updating surrounding schema.

1. Reshape `canvas_users` (same column mapping as Scenario A, Step 3).
2. Add `topic_id` to `canvas_posts` if missing; [migrate the topics pivot](#migrate-topics-from-canvas_posts_topics).
3. Add nullable `user_id` foreign keys on posts/tags/topics → `users.id` if not present.
4. Drop `canvas_posts_topics` and v6-only `canvas_users` columns after data is verified.
5. Run [post-upgrade verification](#post-upgrade-verification).

#### Migrate topics from `canvas_posts_topics`

v6 allowed multiple topics per post via a pivot. v7 stores **one** `topic_id` per post. If a post had multiple topics, pick one (e.g. the first by `topic_id` or the most recently assigned) before dropping the pivot.

**1. Add `topic_id` if the column does not exist:**

```sql
ALTER TABLE canvas_posts ADD COLUMN topic_id CHAR(36) NULL;
CREATE INDEX canvas_posts_topic_id_index ON canvas_posts (topic_id);
```

Syntax varies by database driver — adjust for MySQL/PostgreSQL/SQLite.

**2. Copy pivot data into `topic_id`:**

```sql
UPDATE canvas_posts
SET topic_id = (
    SELECT topic_id FROM canvas_posts_topics
    WHERE canvas_posts_topics.post_id = canvas_posts.id
    LIMIT 1
);
```

**3. Verify:**

```sql
SELECT COUNT(*) FROM canvas_posts p
INNER JOIN canvas_posts_topics ppt ON ppt.post_id = p.id
WHERE p.topic_id IS NULL;
-- investigate any non-zero result before dropping the pivot
```

**4. Drop the pivot when satisfied:**

```sql
DROP TABLE canvas_posts_topics;
```

#### Post-upgrade verification

```bash
php artisan canvas:list-users
php artisan canvas:show-user your@email.com
```

```sql
-- expect 0 for both
SELECT COUNT(*) FROM canvas_users cu
LEFT JOIN users u ON u.id = cu.user_id WHERE u.id IS NULL;

SELECT COUNT(*) FROM canvas_posts p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;
```

1. Sign in via your host app and visit `/canvas` (not 403).
2. Confirm the boot payload includes `user.avatar_url` and `user.canvas`.
3. Open an existing post — author, topic, and tags should be intact.
4. If using digests, confirm `canvas:digest` is scheduled and opted-in users have a valid `timezone`.

### Troubleshooting

| Symptom                            | Likely cause                                     | Fix                                                                |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| 403 on `/canvas` after login       | No `canvas_users` row for the authenticated user | `canvas:make-admin` or `canvas:assign-role`                        |
| 403 with valid session             | Wrong guard                                      | Set `CANVAS_GUARD` to your app's guard                             |
| 403 on admin user routes           | `isAdmin` accessor missing on host `User`        | Add `HasCanvasAccess` to host user model                           |
| Locale validation fails on save    | Locale not translated                            | Publish lang files or restrict `CANVAS_LOCALES` to available codes |
| FK error on `canvas_users.user_id` | Host user does not exist                         | Create the host user first, then grant Canvas access               |
| Posts show wrong author            | `user_id` still points at old v6 IDs             | Re-map `canvas_posts.user_id` to host `users.id`                   |
| Flat user object in custom code    | API shape changed                                | Read `avatar_url` and nested `canvas` from `UserResource`          |

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
