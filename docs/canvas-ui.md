# Canvas UI

## Introduction

Canvas UI is an optional public reader. It is not required for Canvas to work. After publishing, the controller, routes, and views belong to your application — customize them freely.

Authors continue to write in the admin at `/canvas`.

## Publishing

```bash
php artisan canvas:ui
```

This command publishes Blade views, a controller to `app/Http/Controllers/Canvas/CanvasUiController.php`, routes to `routes/canvas-ui.php`, and registers that file from `routes/web.php` if needed.

Visit `/canvas-ui`. Pass `--force` to overwrite previously published files.

## Routes

| Name               | URI                        | Description       |
| ------------------ | -------------------------- | ----------------- |
| `canvas-ui.index`  | `/canvas-ui`               | Published posts   |
| `canvas-ui.show`   | `/canvas-ui/{slug}`        | Single post       |
| `canvas-ui.feed`   | `/canvas-ui/feed`          | RSS feed          |
| `canvas-ui.tags`   | `/canvas-ui/tags`          | Tag index         |
| `canvas-ui.tag`    | `/canvas-ui/tags/{slug}`   | Posts for a tag   |
| `canvas-ui.topics` | `/canvas-ui/topics`        | Topic index       |
| `canvas-ui.topic`  | `/canvas-ui/topics/{slug}` | Posts for a topic |
| `canvas-ui.author` | `/canvas-ui/@{username}`   | Author archive    |

These are ordinary application routes. The show route records views via the `PostViewed` event and Canvas session middleware.

## Customizing

Edit the published controller and views under `resources/views/vendor/canvas/ui`. Prefer `Post::published()` for listings, use `PostSeo` for meta tags, and avoid reading the `pending` column on public pages.

For a fully custom frontend, see [content](./content.md).
