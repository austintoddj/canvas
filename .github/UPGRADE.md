# Upgrade Guide

## Table of Contents

- [Canvas 7](#canvas-7)
    - [Clean break](#clean-break)
    - [Host application contract](#host-application-contract)
    - [Optional: `HasCanvasAccess`](#optional-hascanvasaccess)
    - [Install or reinstall checklist](#install-or-reinstall-checklist)
    - [Architecture](#architecture)
    - [Breaking changes](#breaking-changes)
    - [`canvas_users` schema](#canvas_users-schema)
    - [Configuration](#configuration)
    - [Integrations](#integrations)
    - [Access model](#access-model)
    - [Smoke checks](#smoke-checks)
    - [Troubleshooting](#troubleshooting)
    - [Weekly digest](#weekly-digest)
    - [Support window](#support-window)

## Canvas 7

> Canvas 7 is a **clean break**. There is no supported in-place data migration from prior majors. Host applications own authentication; Canvas owns `canvas_*` tables, author profile/access, and the admin SPA.

### Clean break

If you previously ran an older Canvas major:

1. Back up anything you still need outside the database (markdown exports, media files, etc.).
2. Drop all `canvas_*` tables and remove Canvas rows from the host `migrations` table (or use a fresh database).
3. Install Canvas 7 and run the [checklist](#install-or-reinstall-checklist) as a **new** install.

Do not expect prior `canvas_users` rows, passwords, soft-deletes, multi-topic pivots, or Canvas-owned auth routes to carry forward. Re-grant access with `canvas:make-admin` / `canvas:assign-role` and recreate content as needed.

### Host application contract

Technical home for installers (**not** the public `readme.md`).

| Requirement             | Detail                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Auth**                | Working authentication for `config('canvas.guard')` (single guard; point `CANVAS_GUARD` at `web`, `staff`, etc.)    |
| **User model**          | `config('canvas.user_model')` Eloquent authenticatable                                                              |
| **Identity keys**       | Stock Laravel **bigint** unsigned primary key on the host user model                                                |
| **Identity attributes** | Readable **`name`** and **`email`** (display, digest mail)                                                          |
| **Access**              | A `canvas_users` row grants Canvas access (CLI, admin Users UI, or admin API). Canvas does not create host accounts |
| **Trait**               | `HasCanvasAccess` is **optional** host sugar — not required for routes, gates, policies, digest, or admin API       |
| **Digest**              | Core package feature; works with a bare host `User` (no trait / host relations)                                     |

**Canvas does not require:** owning login/password reset, writing host user rows, multi-guard simultaneous sessions, or config for every custom user schema.

**Non-standard hosts:** UUID/ULID/string host keys or a user table not named `users` → **fork the package migration** once. Do not expect a growing set of env knobs.

**Missing `name` / `email`:** fail clearly at the integration edge (misconfiguration); do not invent silent fallbacks that look like “Canvas is broken.”

### Optional: `HasCanvasAccess`

Not required. Canvas loads profile, roles, and access from `canvas_users` whether or not your host `User` model defines a relationship. Package routes, gates, and policies resolve roles from `canvas_users` directly.

Adding `Canvas\Concerns\HasCanvasAccess` is optional host-app sugar that gives your `User` model:

- a `canvasUser` relationship to `canvas_users`
- `posts`, `tags`, and `topics` relationships for authored content
- role accessors (`isAdmin`, `isEditor`, `isContributor`) for convenience in your own app code
- profile accessors (`username`, `summary`, `avatar`, `locale`, `theme`, `digest`)

```php
use Canvas\Concerns\HasCanvasAccess;

class User extends Authenticatable
{
    use HasCanvasAccess;
}
```

If you skip this, `/canvas` still loads, admin routes still work, and Canvas still checks access against `canvas_users`. Add the trait when you want those relationships and accessors on your host `User` model — for example, `$user->posts` or `$user->isAdmin` in your own controllers or Blade views.

### Install or reinstall checklist

1. Require Canvas 7:

    ```bash
    composer require austintoddj/canvas:^7.0
    # or, if already required:
    composer update austintoddj/canvas
    ```

2. Fresh Canvas schema (after dropping old `canvas_*` tables if any):

    ```bash
    php artisan canvas:install
    # or: php artisan canvas:migrate && php artisan canvas:publish
    ```

3. Publish config if you need to customize it:

    ```bash
    php artisan vendor:publish --tag=canvas-config
    ```

4. _(Optional)_ Add `HasCanvasAccess` to your host `User` model.

5. Link storage and clear views if needed:

    ```bash
    php artisan storage:link
    php artisan view:clear
    ```

6. Grant Canvas access:

    ```bash
    php artisan canvas:make-admin your@email.com
    php artisan canvas:assign-role editor@example.com editor
    php artisan canvas:users
    ```

7. Smoke-test `/canvas` while signed in as a user with a `canvas_users` row.

### Architecture

| Concern                                          | Owner                                      |
| ------------------------------------------------ | ------------------------------------------ |
| Authentication (login, password reset, sessions) | Host application                           |
| Identity (`id`, `name`, `email`)                 | Host `users` table (read-only from Canvas) |
| Canvas access (role), author profile, UI prefs   | `canvas_users` table                       |
| Posts, tags, topics `user_id`                    | Host `users.id` (foreign key)              |

Canvas resolves the host user model via `config('canvas.user_model')` (default `App\Models\User`). It reads `id`, `name`, and `email` from that model for display and does not write to it.

### Breaking changes

#### Routes and authentication

- No Canvas login, logout, or password-reset routes — use the host app.
- Protected routes use `auth:{guard}`, then `EagerLoadCanvasUser` and `Authorize`. Users without a `canvas_users` row receive **403**.
- Admin authorization uses Laravel gates and `can:` middleware (not a Canvas `Admin` middleware class).

#### Artisan commands

| Command                                | Purpose                                        |
| -------------------------------------- | ---------------------------------------------- |
| `canvas:make-admin {user}`             | Grant or promote to Admin                      |
| `canvas:assign-role {user} {role}`     | Assign Contributor, Editor, or Admin           |
| `canvas:remove-access {user}`          | Delete the `canvas_users` row (host untouched) |
| `canvas:users` / `canvas:users {user}` | List access or dump one profile as JSON        |
| `canvas:migrate`                       | Run package schema migrations                  |
| `canvas:publish`                       | Publish admin assets                           |
| `canvas:install`                       | First-time install helper                      |
| `canvas:digest`                        | Weekly author digest (when mail enabled)       |
| `canvas:ui`                            | Optional sample reader views                   |

All `{user}` arguments accept an email address or host user ID.

#### Models

- Identity is the host user model; optionally add `HasCanvasAccess` for a `canvasUser` relationship.
- `Canvas\Models\CanvasUser` is the `canvas_users` row (role, profile, preferences).
- `Post`, `Tag`, and `Topic` `user()` relationships resolve to the host user model.

#### `PostViewed` event

Manual dispatches must pass request context:

```php
event(new Canvas\Events\PostViewed(
    post: $post,
    ip: request()->ip(),
    agent: request()->userAgent(),
    referer: request()->header('referer'),
));
```

#### API and frontend boot payload

`UserResource` is the contract for user endpoints and the SPA boot payload:

```json
{
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar_url": "https://…",
    "posts_count": 12,
    "canvas": {
        "role": 3,
        "username": "jane",
        "summary": "…",
        "avatar": "https://…",
        "avatar_url": "https://…",
        "website": "https://example.com",
        "social": { "twitter": "jane" },
        "locale": "en",
        "timezone": "America/Chicago",
        "theme": "system",
        "digest": true,
        "preferences": {
            "onboarding": { "complete": false }
        }
    }
}
```

- Top-level `id` is the **host** user primary key (stock Laravel: bigint).
- Top-level `avatar_url` is the resolved absolute URL, or empty when using initials in the UI.
- Canvas-specific fields live under nested `canvas` (when `canvasUser` is loaded).
- `role` is an integer enum: `1` Contributor, `2` Editor, `3` Admin.
- UI appearance is `theme` (`system` / `light` / `dark`).
- `POST /api/users/{id}` upserts profile data via `SyncCanvasUser`; initial grant requires a `role` when no `canvas_users` row exists.

#### Database

- `canvas_users.user_id` is the primary key and foreign key to `users.id`.
- Host foreign keys use **stock Laravel bigint** (`unsignedBigInteger` / `foreignId`).
- Content primary keys (posts, tags, topics, media) remain UUIDs.
- Posts have a single `topic_id` FK → `canvas_topics.id` (`nullOnDelete`; no multi-topic pivot).
- `user_id` on posts, tags, topics, and media is nullable and references `users.id`.
- **Custom host key types** or a non-`users` host table → fork the package migration once.

#### JSON resources

Canvas user API responses use `UserResource` / `CanvasUserResource` with **no data wrapper** (`$wrap = null` on those classes only). Canvas does **not** call global `JsonResource::withoutWrapping()`, so host application APIs keep Laravel’s default wrapping.

#### Media soft-delete

`DELETE /api/media/{id}` soft-deletes the `canvas_media` row and **deletes the file from disk**. Restoring the model later will not restore the file — treat media destroy as permanent for storage.

#### Reader analytics session pruning

Optional `canvas:ui` post routes should use `Canvas\Http\Middleware\Session` (already on the published `canvas-ui` show route) so `PostViewed` session keys are pruned. Host apps that fire `PostViewed` outside that sample should apply the same middleware on those reader routes.

### `canvas_users` schema

Hybrid storage: typed columns for queryable fields; `preferences` JSON for long-tail UI settings.

| Column                      | Type                                    | Notes                                                                            |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `user_id`                   | unsignedBigInteger, PK, FK → `users.id` | Same type as stock Laravel `users.id`; cascade delete                            |
| `role`                      | tinyint                                 | `1` Contributor, `2` Editor, `3` Admin                                           |
| `username`                  | string, nullable, unique                | Public author handle                                                             |
| `summary`                   | text, nullable                          | Author bio                                                                       |
| `avatar`                    | string, nullable                        | Absolute image URL (media library / Unsplash); empty → initials in UI            |
| `website`                   | string, nullable                        |                                                                                  |
| `social`                    | json, nullable                          | Key/value social links                                                           |
| `locale`                    | string, nullable                        | Must be in available locales                                                     |
| `timezone`                  | string, nullable                        | IANA timezone; used by `canvas:digest`                                           |
| `theme`                     | string, nullable                        | UI preference: `system`, `light`, or `dark` (API defaults to `system` when null) |
| `digest`                    | boolean, default `false`                | Weekly email opt-in                                                              |
| `preferences`               | json, nullable                          | Merged with defaults; `onboarding.complete` today                                |
| `created_at` / `updated_at` | timestamps                              |                                                                                  |

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

### Integrations

Unsplash and AI providers are configured in the admin SPA at **Integrations** (`/integrations`), not via environment secrets for Unsplash.

- Access keys are stored encrypted in `canvas_settings`.
- The SPA boot payload exposes integration readiness as booleans/flags, never raw secrets.
- When configured, Unsplash appears in the post editor for featured images and body image insert; AI rewrite/SEO appear when an AI provider is configured.

### Access model

Canvas access is a row in `canvas_users`, not a flag on the host user:

- **Grant** — `canvas:make-admin` / `canvas:assign-role`, or `POST /api/users/{id}` with a `role` (admin-only for role changes).
- **Revoke** — `canvas:remove-access` or `DELETE /api/users/{user}` (admin-only; cannot delete yourself).
- **Authorize** — every Canvas route requires an authenticated user with a `canvas_users` row. Contributor, Editor, and Admin roles all pass; role only affects permissions inside Canvas.

`canvas:remove-access` and `UserController@destroy` only delete `canvas_users`. Host `users` rows and authored content are preserved; posts retain their `user_id`.

### Smoke checks

```bash
php artisan canvas:users
php artisan canvas:users your@email.com
```

1. Sign in via the host app (guard from `CANVAS_GUARD`).
2. Visit `/canvas` — must **not** be 403 (requires a `canvas_users` row).
3. Confirm the SPA boot payload includes `user.avatar_url` and nested `user.canvas` (including `user.canvas.theme`).
4. Create or open a post — author, topic, and tags behave as expected.

**Digest:** opted-in users (`canvas_users.digest = true`) should have a valid **IANA** `timezone` on `canvas_users`. Empty timezones fall back to app timezone.

### Troubleshooting

| Symptom                            | Likely cause                                         | Fix                                                                |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| 403 on `/canvas` after login       | No `canvas_users` row for the authenticated user     | `canvas:make-admin` or `canvas:assign-role`                        |
| 403 with valid session             | Wrong guard                                          | Set `CANVAS_GUARD` to your app's guard                             |
| 403 on admin user routes           | Authenticated user is not an Admin in `canvas_users` | `canvas:make-admin` or assign role via `canvas:assign-role`        |
| Locale validation fails on save    | Locale not translated                                | Publish lang files or restrict `CANVAS_LOCALES` to available codes |
| FK error on `canvas_users.user_id` | Host user does not exist                             | Create the host user first, then grant Canvas access               |

### Weekly digest

When `canvas.mail.enabled` is true, the package schedules `canvas:digest` for **Mondays at 08:00** in `config('app.timezone')`. Each recipient’s reporting window uses their `canvas_users.timezone` (`DigestPeriod`); timezone affects which activity falls in the week, not when the scheduler fires. Silent weeks (no views or visitors) do not send mail.

Digest mailables implement Laravel’s `ShouldQueue`. Delivery follows the host queue and mail config:

| Host setup | What you need |
| --- | --- |
| `QUEUE_CONNECTION=sync` (Laravel default) | Nothing extra — digests send inline when the command runs |
| `database` / `redis` / `sqs` / etc. | A queue worker (`queue:work`, Horizon, …). Without one, jobs stay pending and no mail goes out |
| Mail transport | Normal host `MAIL_*` / `MAIL_MAILER` (SMTP, log, SES, …) |

Telescope (or similar) may still show the mailable as **queued** after a successful worker run — that reflects the queue path, not a stuck send.

### Support window

Canvas targets current Laravel major + previous (PHP floor matching the oldest supported major). See `composer.json` and `.github/workflows/tests.yml` for the live matrix.
