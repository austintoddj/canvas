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

`show` loads the post with `Post::forPublicSlug($slug)`. When more than one published post has that slug, the page opens the one with the earliest `published_at`, then the lowest `id`. A controller you have already published keeps its current lookup until you change `show()` or run `php artisan canvas:ui --force`. `--force` overwrites the published controller, routes, and views.

## Customizing

Edit the published controller and views under `resources/views/vendor/canvas/ui`. Prefer `Post::published()` for listings, use `PostSeo` for meta tags, and avoid reading the `pending` column on public pages.

For a fully custom frontend, see [content](./content.md).

## Multilingual reader

When [content languages](./configuration.md#content-languages) are enabled, newly generated reader routes use `/canvas-ui/{locale}/…`. The slug is shared: `/canvas-ui/en/hello` and `/canvas-ui/de/hello` select translations of the same post. Old reader URLs redirect to the primary language. Unsupported language prefixes return 404.

Listings, tag and topic counts, author pages, and RSS use the requested content language and configured fallback. Post pages link to published translations only. Fallback pages declare the actual content language and use its URL as the canonical URL, unless you supplied a custom canonical URL in SEO settings.

Existing published controllers, routes, and overridden views are not updated automatically. Compare them with the current `canvas:ui` output and apply the language middleware, locale-aware route generation, and translated queries to your customized files. Use `Canvas\Support\ReaderUrl::route()` to generate reader links that include the language when the named route declares `{locale}`.
