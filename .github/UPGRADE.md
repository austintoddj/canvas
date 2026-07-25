# Upgrade Guide

## Table of Contents

- [Upgrading to 7.0.0 from 6.0](#upgrading-to-700-from-60)
- [Upgrading to 6.0.0 from 5.4](#upgrading-to-600-from-54)
- [Upgrading to 5.4.0 from 5.3](#upgrading-to-540-from-53)
- [Upgrading to 5.3.0 from 5.2](#upgrading-to-530-from-52)
- [Upgrading to 5.2.0 from 5.1](#upgrading-to-520-from-51)
- [Upgrading to 5.1.0 from 5.0](#upgrading-to-510-from-50)

## Upgrading to 7.0.0 from 6.0

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

    Package registration is automatic via Composer discovery (`Canvas\CanvasServiceProvider`). No host `App\Providers\CanvasServiceProvider` is published or required. If an older install left that file (or a providers entry for it), delete it — it is unused.

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

    Set `APP_URL` to the exact URL you open in the browser (Herd `http://my-app.test`, not a leftover `http://localhost:8000`). Library media on the public disk is stored as root-relative `/storage/...` paths so admin thumbs load even when `APP_URL` is mis-set; Open Graph, webhooks, and similar absolute consumers still follow the request host / `APP_URL`.

6. Grant Canvas access:

    ```bash
    php artisan canvas:make-admin your@email.com
    php artisan canvas:assign-role editor@example.com editor
    php artisan canvas:users
    ```

7. Smoke-test `/canvas` while signed in as a user with a `canvas_users` row: upload media → set a featured image → confirm the posts index thumbnail and (if published) the public reader image load.

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

#### Post lifecycle domain events

Canvas dispatches Laravel events when a post’s **public snapshot** changes (never on pending-only autosave). Hosts may listen with zero webhook configuration:

| Event class                     | When                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `Canvas\Events\PostPublished`   | Snapshot becomes live (`published_at` ≤ now)                                     |
| `Canvas\Events\PostScheduled`   | Snapshot gains a future `published_at`                                           |
| `Canvas\Events\PostUpdated`     | Live or scheduled snapshot content changes while staying public                  |
| `Canvas\Events\PostUnpublished` | `published_at` cleared (or live moved to scheduled; paired with `PostScheduled`) |
| `Canvas\Events\PostDeleted`     | Soft-deleted                                                                     |

```php
use Canvas\Events\PostPublished;
use Illuminate\Support\Facades\Event;

Event::listen(PostPublished::class, function (PostPublished $event): void {
    // $event->post
});
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
- Top-level `avatar_url` is the resolved avatar for display (root-relative public-disk path or absolute remote URL), or **`null`** when using initials in the UI.
- Canvas-specific fields live under nested `canvas` (when `canvasUser` is loaded). `canvas.avatar` and `canvas.avatar_url` use the same stored form.
- `role` is an integer enum: `1` Contributor, `2` Editor, `3` Admin.
- UI appearance is `theme` (`system` / `light` / `dark`).
- `POST /api/users/{id}` upserts profile data via `SyncCanvasUser`; initial grant requires a `role` when no `canvas_users` row exists.

### Publishing model

How writes relate to what readers and host apps see:

- **Drafts and scheduled posts** — autosave writes the row directly.
- **Live posts** — autosave writes `pending` JSON only so the public snapshot stays stable.
- **Update** (`promote: true`) — writes the pending snapshot live and clears `pending`.
- **Discard** — restores the live snapshot and clears `pending`.
- **Public / host readers** (including optional `canvas:ui`) must use the live columns only — **never** `pending`.
- Domain events and outbound webhooks fire only on **public snapshot** mutations (see [Post lifecycle domain events](#post-lifecycle-domain-events) and [Webhooks](#webhooks)), never on pending-only autosave or discard.

#### Database

- `canvas_users.user_id` is the primary key and foreign key to `users.id`.
- Host foreign keys use **stock Laravel bigint** (`unsignedBigInteger` / `foreignId`).
- Content primary keys (posts, tags, topics, media) remain UUIDs.
- Posts have a single `topic_id` FK → `canvas_topics.id` (`nullOnDelete`; no multi-topic pivot).
- `user_id` on posts, tags, topics, and media is nullable and references `users.id`.
- **Custom host key types** or a non-`users` host table → fork the package migration once.

#### JSON resources

Canvas user API responses use `UserResource` / `CanvasUserResource` with **no data wrapper** (`$wrap = null` on those classes only). Canvas does **not** call global `JsonResource::withoutWrapping()`, so host application APIs keep Laravel’s default wrapping.

#### Media URLs (public disk)

- Library media `url`, post `featured_image` (library picks), and user `avatar` for public-disk files are **root-relative** (`/storage/canvas/images/...`), not absolute hosts derived from `APP_URL`.
- Unsplash and other remote URLs remain absolute `https://…`.
- Non-local disks (S3, CDN) still return absolute object URLs.
- SEO / Open Graph and outbound webhooks expand local storage references to absolute URLs for external consumers.
- Broken images with a working `storage:link` usually mean a missing symlink or a remote disk misconfiguration — not “set APP_URL for thumbs.” Still set `APP_URL` correctly for OG tags and webhooks.

#### Media soft-delete

`DELETE /api/media/{id}` soft-deletes the `canvas_media` row and **deletes the file from disk**. Restoring the model later will not restore the file — treat media destroy as permanent for storage.

#### Reader analytics session pruning

Optional `canvas:ui` post routes should use `Canvas\Http\Middleware\Session` (already on the published `canvas-ui` show route) so `PostViewed` session keys are pruned. Host apps that fire `PostViewed` outside that sample should apply the same middleware on those reader routes.

### `canvas_users` schema

Hybrid storage: typed columns for queryable fields; `preferences` JSON for long-tail UI settings.

| Column                      | Type                                    | Notes                                                                                                           |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `user_id`                   | unsignedBigInteger, PK, FK → `users.id` | Same type as stock Laravel `users.id`; cascade delete                                                           |
| `role`                      | tinyint                                 | `1` Contributor, `2` Editor, `3` Admin                                                                          |
| `username`                  | string, nullable, unique                | Public author handle                                                                                            |
| `summary`                   | text, nullable                          | Author bio                                                                                                      |
| `avatar`                    | string, nullable                        | Image URL: root-relative `/storage/...` for library media, absolute for Unsplash/remote; empty → initials in UI |
| `website`                   | string, nullable                        |                                                                                                                 |
| `social`                    | json, nullable                          | Key/value social links                                                                                          |
| `locale`                    | string, nullable                        | Must be in available locales                                                                                    |
| `timezone`                  | string, nullable                        | IANA timezone; used by `canvas:digest`                                                                          |
| `theme`                     | string, nullable                        | UI preference: `system`, `light`, or `dark` (API defaults to `system` when null)                                |
| `digest`                    | boolean, default `false`                | Weekly email opt-in                                                                                             |
| `preferences`               | json, nullable                          | Merged with defaults; `onboarding.complete` today                                                               |
| `created_at` / `updated_at` | timestamps                              |                                                                                                                 |

### Configuration

Confirm these settings in `config/canvas.php` (publish with `php artisan vendor:publish --tag=canvas-config` if needed):

```php
'user_model' => env('CANVAS_USER_MODEL', 'App\Models\User'),
'guard' => env('CANVAS_GUARD', 'web'),
'middleware' => ['web'],
'locales' => ($locales = env('CANVAS_LOCALES')) ? array_values(array_filter(array_map('trim', explode(',', $locales)))) : [],
```

| Key               | Env                      | Default / notes                                                                                                                                                                                                                       |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_model`      | `CANVAS_USER_MODEL`      | `App\Models\User` — host Eloquent class Canvas reads identity from                                                                                                                                                                    |
| `guard`           | `CANVAS_GUARD`           | `web` — applied as `auth:{guard}` on all Canvas routes                                                                                                                                                                                |
| `middleware`      | —                        | `['web']` — additional middleware applied before auth                                                                                                                                                                                 |
| `locales`         | `CANVAS_LOCALES`         | empty = full package catalog; comma-separated codes restrict the picker (`en,es`). Codes without translation files are ignored                                                                                                        |
| `domain`          | `CANVAS_DOMAIN`          | `null` — optional subdomain for the admin SPA                                                                                                                                                                                         |
| `path`            | `CANVAS_PATH`            | `canvas` → admin at `/canvas` by default                                                                                                                                                                                              |
| `storage_disk`    | `CANVAS_STORAGE_DISK`    | `public` — disk for media uploads                                                                                                                                                                                                     |
| `storage_path`    | `CANVAS_STORAGE_PATH`    | `canvas` — path prefix on that disk                                                                                                                                                                                                   |
| `upload_filesize` | `CANVAS_UPLOAD_FILESIZE` | Desired max in bytes (`3145728` = 3 MB). Runtime effective max is `min(config, PHP upload/post limits)` so the SPA never allows more than the server accepts. Oversized Canvas API requests return JSON **413** with a clear message. |
| `mail.enabled`    | `CANVAS_MAIL_ENABLED`    | `false` — weekly author digest (see [Weekly digest](#weekly-digest))                                                                                                                                                                  |

Your host app owns login, logout, and password reset for the configured guard.

### Integrations

Unsplash, AI providers, and outbound **webhooks** are configured in the admin SPA at **Integrations** (`/integrations`). Admins need the `manage-integrations` gate (Canvas Admin role).

- Secrets (Unsplash key, AI key, webhook signing secret) are stored encrypted in `canvas_settings`.
- The SPA boot payload exposes Unsplash/AI readiness as booleans only — never raw secrets. Webhooks are configured only via the Integrations API/UI (no boot flag).
- When configured, Unsplash appears in the post editor for featured images and body image insert; AI rewrite/SEO appear when an AI provider is configured.

#### Webhooks

Outbound HTTPS notifications for post lifecycle changes (Zapier, Make, n8n, Slack catch hooks, host APIs, CDN purge jobs, etc.).

**Configure:** Integrations → Webhooks — public HTTPS URL, subscribed events, auto-generated signing secret (shown once; rotatable). **Send test** posts a signed `webhook.test` payload immediately.

**Events (subscribable):**

| Event id           | Domain event      |
| ------------------ | ----------------- |
| `post.published`   | `PostPublished`   |
| `post.scheduled`   | `PostScheduled`   |
| `post.updated`     | `PostUpdated`     |
| `post.unpublished` | `PostUnpublished` |
| `post.deleted`     | `PostDeleted`     |

`webhook.test` is only used by the admin test button (not a subscription option).

**Delivery:**

| Item                 | Value                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Method               | `POST`                                                                               |
| Content-Type         | `application/json`                                                                   |
| `User-Agent`         | `Canvas-Webhooks/1.0`                                                                |
| `Canvas-Event`       | Event id (e.g. `post.published`)                                                     |
| `Canvas-Delivery-Id` | UUID for this delivery                                                               |
| `Canvas-Signature`   | `t={unix},v1={hex}` — HMAC-SHA256 of `{timestamp}.{rawBody}` with the signing secret |
| Success              | HTTP 2xx (lifecycle jobs retry: 3 attempts, backoff 30s / 2m / 10m)                  |
| URL rules            | HTTPS only; private/reserved IPs blocked                                             |

**Payload** (`api_version: 1`) includes post metadata (id, slug, title, summary, published_at, featured image, SEO meta, topic/tags, author). It does **not** include the full HTML body. Local public-disk featured images are **absolute** in the payload (expanded for external subscribers); remote URLs stay absolute as stored.

```json
{
    "api_version": 1,
    "event": "post.published",
    "delivery_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "created_at": "2026-07-22T15:04:05+00:00",
    "data": {
        "id": "…",
        "slug": "…",
        "title": "…",
        "summary": "…",
        "published_at": "…",
        "featured_image": "…",
        "featured_image_caption": "…",
        "meta": {},
        "topic": { "name": "…", "slug": "…" },
        "tags": [{ "name": "…", "slug": "…" }],
        "author": { "id": 1, "name": "Jane", "username": "jane" },
        "created_at": "…",
        "updated_at": "…"
    }
}
```

**Verify signature (receiver sketch):**

```php
// $header = request header Canvas-Signature, e.g. "t=1721657645,v1=abc…"
// $rawBody = raw request body string; $secret = the signing secret from Integrations
[$t, $v1] = /* parse t= and v1= from $header */;
$expected = hash_hmac('sha256', "{$t}.{$rawBody}", $secret);
hash_equals($expected, $v1); // also reject if |now - $t| is too large
```

Or use `Canvas\Support\WebhookSigner::verify($secret, $rawBody, $header)`.

**Queue:** lifecycle delivery uses `DeliverWebhookJob` (`ShouldQueue`) — same host pattern as weekly digest mail. **Send test** runs that same job via `dispatchSync` so the admin UI gets an immediate success/failure.

| Host setup                                | Lifecycle webhooks                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `QUEUE_CONNECTION=sync` (Laravel default) | Delivered inline when events fire — no worker process                            |
| `database` / `redis` / `sqs` / etc.       | Run `queue:work` (or Horizon). Without a worker, jobs stay pending after publish |

**Scheduled go-live limitation:** A post with a future `published_at` becomes reader-visible when time passes **without** another write. Canvas does **not** automatically fire `post.published` at that instant. You receive `post.scheduled` when the future date is set. Exact go-live hooks can listen for schedule set, poll, or wait until a future poller lands.

**Fire rules:** No deliveries for pending-only autosave, discard pending, or draft-only edits. Only true public snapshot mutations (and soft-delete).

### Access model

Canvas access is a row in `canvas_users`, not a flag on the host user:

- **Grant** — `canvas:make-admin` / `canvas:assign-role`, or `POST /api/users/{id}` with a `role` (admin-only for role changes).
- **Revoke** — `canvas:remove-access` or `DELETE /api/users/{user}` (admin-only; cannot delete yourself).
- **Authorize** — every Canvas route requires an authenticated user with a `canvas_users` row. Contributor, Editor, and Admin roles all pass; role only affects permissions inside Canvas.

`canvas:remove-access` and `UserController@destroy` only delete `canvas_users`. Host `users` rows and authored content are preserved; posts retain their `user_id`.

| Capability                            | Contributor | Editor | Admin |
| ------------------------------------- | ----------- | ------ | ----- |
| Access admin (`canvas_users` row)     | ✓           | ✓      | ✓     |
| Own posts & media                     | ✓           | ✓      | ✓     |
| All posts & media                     |             | ✓      | ✓     |
| Users (`manage-users`)                |             |        | ✓     |
| Organize taxonomy (`manage-taxonomy`) |             |        | ✓     |
| Integrations (`manage-integrations`)  |             |        | ✓     |

### Smoke checks

```bash
php artisan canvas:users
php artisan canvas:users your@email.com
```

1. Sign in via the host app (guard from `CANVAS_GUARD`).
2. Visit `/canvas` (or your configured `path`) — must **not** be 403 (requires a `canvas_users` row).
3. Confirm the SPA boot payload includes `user.avatar_url` and nested `user.canvas` (including `user.canvas.theme`).
4. Create or open a post — author, topic, and tags behave as expected.
5. _(Optional)_ With Integrations configured: Unsplash/AI readiness booleans in the boot payload; Webhooks **Send test** returns success against your receiver.

**Digest:** opted-in users (`canvas_users.digest = true`) should have a valid **IANA** `timezone` on `canvas_users`. Empty timezones fall back to app timezone. With `CANVAS_MAIL_ENABLED=true`, confirm `php artisan schedule:list` shows `canvas:digest`.

### Troubleshooting

| Symptom                                           | Likely cause                                                                     | Fix                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 403 on `/canvas` after login                      | No `canvas_users` row for the authenticated user                                 | `canvas:make-admin` or `canvas:assign-role`                                                                                                                         |
| 403 with valid session                            | Wrong guard                                                                      | Set `CANVAS_GUARD` to your app's guard                                                                                                                              |
| 403 on admin user routes                          | Authenticated user is not an Admin in `canvas_users`                             | `canvas:make-admin` or assign role via `canvas:assign-role`                                                                                                         |
| Locale validation fails on save                   | Locale not translated                                                            | Publish lang files or restrict `CANVAS_LOCALES` to available codes                                                                                                  |
| FK error on `canvas_users.user_id`                | Host user does not exist                                                         | Create the host user first, then grant Canvas access                                                                                                                |
| Digest never sends                                | Scheduler not running, mail disabled, user not opted in, or queue worker missing | Enable `CANVAS_MAIL_ENABLED`; set `digest` + IANA `timezone` on `canvas_users`; run host cron for `schedule:run`; run a queue worker unless `QUEUE_CONNECTION=sync` |
| Webhook test works but publish never hits the URL | Queue worker not running (non-`sync` driver), or event not subscribed            | Run `php artisan queue:work` (or use `QUEUE_CONNECTION=sync`); confirm **Published** (etc.) is selected under Events                                                |
| Webhook test fails                                | URL unreachable or non-2xx                                                       | Fix the receiver; Send test runs the delivery job synchronously for immediate feedback                                                                              |
| Webhook secret lost after configure               | Plain secret is shown once                                                       | Rotate secret in Integrations and update your receiver                                                                                                              |

### Weekly digest

When `canvas.mail.enabled` is true (`CANVAS_MAIL_ENABLED`), **`Canvas\CanvasServiceProvider`** registers `canvas:digest` for **Mondays at 08:00** in `config('app.timezone')` — hosts do not register the command themselves, but **must run Laravel’s scheduler** (typical host cron: `* * * * * php artisan schedule:run`) or the digest never fires. Each recipient’s reporting window uses their `canvas_users.timezone` (`DigestPeriod`); timezone affects which activity falls in the week, not when the scheduler fires. Silent weeks (no views or visitors) do not send mail.

Digest mailables implement Laravel’s `ShouldQueue`. Delivery follows the host queue and mail config:

| Host setup                                | What you need                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scheduler                                 | Host cron (or equivalent) running `php artisan schedule:run` every minute                      |
| `QUEUE_CONNECTION=sync` (Laravel default) | Nothing extra for the queue — digests send inline when the command runs                        |
| `database` / `redis` / `sqs` / etc.       | A queue worker (`queue:work`, Horizon, …). Without one, jobs stay pending and no mail goes out |
| Mail transport                            | Normal host `MAIL_*` / `MAIL_MAILER` (SMTP, log, SES, …)                                       |

Telescope (or similar) may still show the mailable as **queued** after a successful worker run — that reflects the queue path, not a stuck send.

### Support window

Canvas 7 requires PHP 8.3+ and Laravel 12 or 13. Laravel 11 and PHP 8.2 are not supported.

| Runtime     | Versions                        |
| ----------- | ------------------------------- |
| **PHP**     | 8.3+ (CI matrix: 8.3, 8.4, 8.5) |
| **Laravel** | 12 and 13                       |

Treat `composer.json` and `.github/workflows/tests.yml` as the live source of truth.

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
