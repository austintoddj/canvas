# Content

## Introduction

Canvas is headless: published content lives in the database. Build your public site with Eloquent (or an API you own). The JSON routes under `/canvas/api` power the admin SPA only — they require a signed-in Canvas user and are not a public blog API.

Models live under `Canvas\Models\`.

## Retrieving posts

```php
use Canvas\Models\Post;

$posts = Post::published()
    ->with(['user', 'topic', 'tags'])
    ->latest()
    ->paginate();

$post = Post::published()
    ->with(['user', 'tags', 'topic'])
    ->firstWhere('slug', $slug);
```

| Scope         | Description                                   |
| ------------- | --------------------------------------------- |
| `published()` | `published_at` is set and not in the future   |
| `draft()`     | No `published_at`, or a future `published_at` |

### Published vs pending

While a post is live, the editor autosaves into a `pending` JSON column so the public columns stay stable. Readers must use the live columns (`title`, `body`, and so on), never `pending`. Promoting or publishing in the admin merges pending into the public snapshot.

### Useful attributes

| Attribute          | Notes                                                    |
| ------------------ | -------------------------------------------------------- |
| `id`               | UUID                                                     |
| `slug`             | Unique per author                                        |
| `title`, `summary` | Plain text                                               |
| `body`             | HTML from the editor                                     |
| `published_at`     | `null` draft · future scheduled · past/now live          |
| `featured_image`   | URL or `/storage/...` path                               |
| `meta`             | SEO fields (`title`, `description`, `canonical_link`, …) |
| `pending`          | Unpublished edits (editor only)                          |
| `user_id`          | Host user id                                             |
| `topic_id`         | Optional topic                                           |

When a future `published_at` elapses, `published()` already includes the post. Canvas runs `canvas:announce-scheduled` every minute so domain events and outbound webhooks receive `PostPublished` without another editor save.

## Version history

The admin stores **content checkpoints** in `canvas_post_revisions` for editorial recovery — not every autosave, and never for public readers.

| What is stored | Full editor-visible snapshot: title, slug, summary, body, featured image fields, SEO `meta`   |
| -------------- | --------------------------------------------------------------------------------------------- |
| Why (`reason`) | Lifecycle moments such as first version, published, scheduled, updated, left editor, restored |
| User labels    | Optional names (rename in the UI) for quick filtering                                         |

Checkpoints are created when a post is first saved with content, when visibility changes (publish / schedule / unpublish), when a live **Update** promotes changed content, when the author leaves the editor with unsaved-session content, and when a revision is restored. Draft and live **pending** autosaves do not append history rows.

### Restore vs `pending`

- **Draft / scheduled:** restore writes the snapshot into the public columns (the editor’s working state).
- **Live posts:** restore writes into `pending` so readers still see the live public columns until an editor promotes with **Update**.

Public frontends must never join or expose revision rows. Use `Post::published()` and the live columns only.

### Retention

Canvas keeps the **newest 50 checkpoints per post** (prune-on-write after each new row). Operators may tighten or re-run:

```bash
php artisan canvas:prune-post-revisions
php artisan canvas:prune-post-revisions --keep=25
```

The host scheduler runs the prune weekly.

## Tags, topics, and authors

```php
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\CanvasUser;

$posts = Tag::firstWhere('slug', $slug)
    ->posts()
    ->published()
    ->latest()
    ->paginate();

$posts = Topic::firstWhere('slug', $slug)
    ->posts()
    ->published()
    ->latest()
    ->paginate();

$author = CanvasUser::query()->where('username', $username)->firstOrFail();

$posts = Post::query()
    ->where('user_id', $author->user_id)
    ->published()
    ->latest()
    ->paginate();
```

## SEO

```php
use Canvas\Support\PostSeo;

$seo = PostSeo::resolve($post, url()->current());
```

Returns title, description, canonical URL, and image fields suitable for meta tags and JSON-LD.

## Views and visits

To record a view on your own show route:

```php
event(new \Canvas\Events\PostViewed(
    post: $post,
    ip: request()->ip(),
    agent: request()->userAgent(),
    referer: request()->header('referer'),
));
```

Apply `Canvas\Http\Middleware\Session` on that route so session keys stay tidy (Canvas UI does this for you).

## Post body HTML

`body` is HTML from the TipTap editor, not Markdown. Escape titles and summaries; render body as HTML intentionally (`{!! $post->body !!}` in Blade).

| Content      | Typical markup                                 |
| ------------ | ---------------------------------------------- |
| Text         | `p`, `h1`–`h3`, lists, `blockquote`            |
| Images       | `img.canvas-post-body-image`                   |
| Code         | `pre.canvas-post-body-code`                    |
| YouTube      | `div[data-youtube-video] > iframe`             |
| Video embeds | `div[data-canvas-iframe][data-layout="video"]` |
| X / Twitter  | `div[data-canvas-iframe][data-layout="card"]`  |

Canvas UI ships embed CSS and a small script for X card height in `ui/partials/embeds.blade.php`. Custom frontends should reuse that pattern — tweet iframes do not resize with CSS alone.

Media on the public disk is usually a root-relative `/storage/...` path. Run `storage:link` if images 404.

## Building your own API

```php
use Canvas\Models\Post;
use Canvas\Support\PostSeo;

Route::get('/blog/posts', function () {
    return Post::published()
        ->select(['id', 'slug', 'title', 'summary', 'featured_image', 'published_at', 'user_id', 'topic_id'])
        ->with(['topic:id,name,slug', 'user:id,name'])
        ->latest()
        ->paginate(10);
});

Route::get('/blog/posts/{slug}', function (string $slug) {
    $post = Post::published()
        ->with(['tags:name,slug', 'topic:id,name,slug', 'user:id,name'])
        ->firstWhere('slug', $slug) ?? abort(404);

    return [
        'post' => $post,
        'seo' => PostSeo::resolve($post, url("/blog/{$slug}")),
    ];
});
```

Never expose `pending` or sensitive host user fields. For cache invalidation and SSG rebuilds, prefer [webhooks](./webhooks.md).
