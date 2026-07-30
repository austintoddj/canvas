# Configuration

## Introduction

All of Canvas's configuration options live in `config/canvas.php`. Publish the file when you need to change defaults:

```bash
php artisan vendor:publish --tag=canvas-config
```

Most options may also be set via environment variables.

## Options

| Option | Environment variable | Default |
| ------ | -------------------- | ------- |
| `domain` | `CANVAS_DOMAIN` | `null` |
| `path` | `CANVAS_PATH` | `canvas` |
| `user_model` | `CANVAS_USER_MODEL` | `App\Models\User` |
| `guard` | `CANVAS_GUARD` | `web` |
| `locales` | `CANVAS_LOCALES` | `[]` (all catalog languages) |
| `middleware` | — | `['web']` |
| `storage_disk` | `CANVAS_STORAGE_DISK` | `public` |
| `storage_path` | `CANVAS_STORAGE_PATH` | `canvas` |
| `upload_filesize` | `CANVAS_UPLOAD_FILESIZE` | `3145728` (3 MB) |
| `mail.enabled` | `CANVAS_MAIL_ENABLED` | `false` |

### Path and domain

By default the admin is available at `/canvas`. You may change the path:

```env
CANVAS_PATH=studio
```

To serve the admin from a subdomain, set `CANVAS_DOMAIN`.

### Authentication

Canvas authenticates against the guard named by `CANVAS_GUARD`. Your application owns login, logout, and password reset for that guard.

```env
CANVAS_GUARD=staff
```

### Locales

Leave `CANVAS_LOCALES` empty to offer every language in the package catalog. To limit the language picker, provide a comma-separated list of codes:

```env
CANVAS_LOCALES=en,es,fr
```

### Storage

Uploads use the disk and path prefix you configure. Public-disk files are typically stored as root-relative paths such as `/storage/canvas/...`. Ensure `php artisan storage:link` has been run (`canvas:install` does this for you).

```env
CANVAS_STORAGE_DISK=public
CANVAS_STORAGE_PATH=canvas
```

The effective upload limit is the minimum of `upload_filesize` and PHP's `upload_max_filesize` / `post_max_size`. Oversized requests return HTTP 413.

### Weekly digest

When mail is enabled, Canvas schedules `canvas:digest` for Mondays at 08:00 in your application timezone. Recipients must opt in (`digest` on their Canvas profile) and should set an IANA timezone.

```env
CANVAS_MAIL_ENABLED=true
```

Your host must run the scheduler (`php artisan schedule:run` every minute). Digest mail is queued, so run a queue worker unless `QUEUE_CONNECTION=sync`.

## Integrations

Unsplash, AI providers, and webhooks are configured in the admin under **Integrations**. Secrets are stored encrypted; the SPA only receives readiness booleans. See [webhooks](./webhooks.md).
