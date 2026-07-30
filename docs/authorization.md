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
