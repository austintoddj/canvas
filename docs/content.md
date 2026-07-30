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

| Scope | Description |
| ----- | ----------- |
| `published()` | `published_at` is set and not in the future |
| `draft()` | No `published_at`, or a future `published_at` |

### Published vs pending

While a post is live, the editor autosaves into a `pending` JSON column so the public columns stay stable. Readers must use the live columns (`title`, `body`, and so on), never `pending`. Promoting or publishing in the admin merges pending into the public snapshot.

### Useful attributes

| Attribute | Notes |
| --------- | ----- |
| `id` | UUID |
| `slug` | Unique per author |
| `title`, `summary` | Plain text |
| `body` | HTML from the editor |
| `published_at` | `null` draft · future scheduled · past/now live |
| `featured_image` | URL or `/storage/...` path |
| `meta` | SEO fields (`title`, `description`, `canonical_link`, …) |
| `pending` | Unpublished edits (editor only) |
| `user_id` | Host user id |
| `topic_id` | Optional topic |

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

| Content | Typical markup |
| ------- | -------------- |
| Text | `p`, `h1`–`h3`, lists, `blockquote` |
| Images | `img.canvas-post-body-image` |
| Code | `pre.canvas-post-body-code` |
| YouTube | `div[data-youtube-video] > iframe` |
| Video embeds | `div[data-canvas-iframe][data-layout="video"]` |
| X / Twitter | `div[data-canvas-iframe][data-layout="card"]` |

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
