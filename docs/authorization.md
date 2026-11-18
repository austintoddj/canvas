# Authorization

## Introduction

Canvas does not replace your application's authentication. After a user signs in through your app, Canvas checks for a row in `canvas_users`. Without that row, `/canvas` returns 403.

## Granting access

```bash
php artisan canvas:make-admin you@example.com
php artisan canvas:assign-role editor@example.com editor
php artisan canvas:remove-access former@example.com
php artisan canvas:users
```

You may also manage users from the admin UI as an Admin. Removing access deletes only the `canvas_users` row; the host user and their posts remain.

## Roles

| Role        | Description                                    |
| ----------- | ---------------------------------------------- |
| Contributor | Manage their own posts and media               |
| Editor      | Manage all posts and media                     |
| Admin       | Users, taxonomy, integrations, and full access |

| Capability        | Contributor | Editor | Admin |
| ----------------- | ----------- | ------ | ----- |
| Access admin      | ✓           | ✓      | ✓     |
| Own posts & media | ✓           | ✓      | ✓     |
| All posts & media |             | ✓      | ✓     |
| Users             |             |        | ✓     |
| Taxonomy          |             |        | ✓     |
| Integrations      |             |        | ✓     |

Roles are stored as integers: `1` Contributor, `2` Editor, `3` Admin.

Library tags follow media `view` / `update` (Contributor own files, Editor all files). Any author may create a tag; rename and delete are Editor+. This is not the Admin-only `manage-taxonomy` gate used for public post tags.

## Route protection

Canvas routes use your configured middleware (default `web`), then `auth:{guard}`, then a Canvas access check. There are no Canvas login or password-reset routes.

## The HasCanvasAccess trait

The `HasCanvasAccess` trait is optional. Canvas does not require it for routes, policies, or the admin SPA.

When added to your user model, it provides a `canvasUser` relationship, content relationships (`posts`, `tags`, `topics`), and helpers such as `isAdmin`:

```php
use Canvas\Concerns\HasCanvasAccess;

class User extends Authenticatable
{
    use HasCanvasAccess;
}
```

## Author profiles

Canvas stores author profile data on `canvas_users`: role, username, summary, avatar, website, social links, locale, timezone, theme, digest preference, and a `preferences` JSON column for UI settings.

## Author display names

Canvas uses your user model's `name` attribute by default. Existing applications do not need to change their models.

To customize the display name, define an accessor on your user model. No Canvas trait is required:

```php
public function getCanvasNameAttribute(): string
{
    return trim("{$this->first_name} {$this->last_name}");
}
```

You may instead use Laravel's `Attribute` accessor syntax:

```php
use Illuminate\Database\Eloquent\Casts\Attribute;

protected function canvasName(): Attribute
{
    return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
}
```

Canvas prefers a `canvas_name` accessor when one exists, including Laravel's `Attribute` accessor syntax. A database column named `canvas_name` alone does not change the display name. Custom schemas do not need a `name` column when an accessor supplies the name.

Display names are used in the admin, public author and post pages, and digest greetings. Author payloads retain their `name` field. Canvas loads the host attributes needed by your accessor but includes only explicit user and author fields in its responses. User search matches resolved display names and Canvas usernames in batches. All names use the same case-insensitive comparison with Latin accents folded (`Jose` matches `José`); other scripts are preserved. Searches may scan more users when names are computed.

A reader previously published with `canvas:ui` keeps using `$user->name` until you update its views or republish it:

```bash
php artisan canvas:ui --force
```

This overwrites the published controller, routes, and views. Preserve your customizations before running the command.
