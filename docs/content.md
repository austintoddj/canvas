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

$post = Post::forPublicSlug($slug)
    ->with(['user', 'tags', 'topic'])
    ->first();
```

| Scope                  | Description                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `published()`          | `published_at` is set and not in the future                                                             |
| `draft()`              | No `published_at`, or a future `published_at`                                                           |
| `forPublicSlug($slug)` | Published post for this slug. Shared slugs resolve to the earliest `published_at`, then the lowest `id` |

### Slugs

Saving a new post, or changing a slug to one another post already uses, stores the next free suffix (`hello-world-2`, then `hello-world-3`). The other post is left unchanged. The saved post is returned with the slug that was stored.

A post keeps the slug it already has. That includes older rows that still share a slug. On a public page, call `forPublicSlug()` so the URL opens one post: the earliest `published_at`, then the lowest `id`. Drafts and scheduled posts are skipped.

```php
$post = Post::forPublicSlug($slug)->firstOrFail();
```

### Published vs pending

While a post is live, the editor autosaves into a `pending` JSON column so the public columns stay stable. Readers must use the live columns (`title`, `body`, and so on), never `pending`. Promoting or publishing in the admin merges pending into the public snapshot.

### Useful attributes

| Attribute          | Notes                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `id`               | UUID                                                                                     |
| `slug`             | Public URL key. New and edited slugs are suffixed until unique. An existing slug is kept |
| `title`, `summary` | Plain text                                                                               |
| `body`             | HTML from the editor                                                                     |
| `published_at`     | `null` draft · future scheduled · past/now live                                          |
| `featured_image`   | URL or `/storage/...` path                                                               |
| `meta`             | SEO fields (`title`, `description`, `canonical_link`, …)                                 |
| `pending`          | Unpublished edits (editor only)                                                          |
| `user_id`          | Host user id                                                                             |
| `topic_id`         | Optional topic                                                                           |

When a future `published_at` elapses, `published()` already includes the post. Canvas runs `canvas:announce-scheduled` every minute so domain events and outbound webhooks receive `PostPublished` without another editor save. Opening the editor or promoting pending changes after the clock has elapsed does not itself fire `PostPublished`; the scheduler still announces once.

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

Canvas keeps the **newest 50 checkpoints per post** (prune-on-write after each new row). Named revisions are not exempt — a label does not protect a row from retention. Operators may tighten or re-run:

```bash
php artisan canvas:prune-post-revisions
php artisan canvas:prune-post-revisions --keep=25
```

The host scheduler runs the prune weekly.

## Tags, topics, and authors

Admin media library labels (`canvas_media_tags` / `Canvas\Models\MediaTag`) organize files in the Canvas UI. They are not `Canvas\Models\Tag`, do not appear on `canvas-ui.tags` routes, and should not be queried on the public reader.

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

`body` is HTML from the TipTap editor, not Markdown. Escape titles and summaries. Render the body as HTML (`{!! $post->body !!}`).

Iframe embeds must be `https` (YouTube, Vimeo, X, or any other `https` URL inserted in the editor). On save and on read, Canvas drops any other iframe URL, `srcdoc`, scripts, and event-handler attributes. Posts saved before that check still render without the unsafe markup. Custom themes can keep reading `$post->body`.

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
use Canvas\Support\PostAuthor;
use Canvas\Support\PostSeo;

Route::get('/blog/posts', function () {
    $posts = Post::published()
        ->select(['id', 'slug', 'title', 'summary', 'featured_image', 'published_at', 'user_id', 'topic_id'])
        ->with('topic:id,name,slug')
        ->latest()
        ->paginate(10);

    $authors = PostAuthor::mapByUserIds($posts->getCollection()->pluck('user_id')->all());

    return $posts->through(fn (Post $post): array => [
        ...$post->toArray(),
        'user' => $authors[$post->user_id] ?? null,
    ]);
});

Route::get('/blog/posts/{slug}', function (string $slug) {
    $post = Post::forPublicSlug($slug)
        ->with(['tags:name,slug', 'topic:id,name,slug', 'user'])
        ->first() ?? abort(404);

    $author = PostAuthor::for($post);
    $post->unsetRelation('user');
    $post->makeHidden('pending');

    return [
        'post' => [...$post->toArray(), 'user' => $author],
        'seo' => PostSeo::resolve($post, url("/blog/{$slug}")),
    ];
});
```

For listings, `PostAuthor::mapByUserIds()` loads host users and Canvas profiles in one batch for the page, avoiding a profile query per post. It loads complete host models so custom display-name accessors can read their source columns.

For a single post, load the full `user` relation and call `PostAuthor::for()`. Both helpers return only the author ID, resolved name, Canvas username, and avatar URL. Replace any loaded host relation with that payload before serializing the post.

Never expose `pending` or sensitive host user fields. For cache invalidation and SSG rebuilds, prefer [webhooks](./webhooks.md).

## Multilingual posts

A multilingual post shares its ID, slug, author, featured image and caption, tags, topic, views, and visits. Title, summary, HTML body, and SEO metadata belong to each translation. Publication dates, scheduled announcements, pending edits, and version history are independent per language.

### Enabling translations

Configure your [content languages](./configuration.md#content-languages), leaving the feature disabled. Run package migrations, then explicitly assign the existing content to the configured primary language:

```bash
php artisan migrate
php artisan canvas:translate-posts --locale=en --dry-run
php artisan canvas:translate-posts --locale=en
```

Run the transfer while editorial writes are stopped. It copies existing content, pending changes, publication markers, and history, including soft-deleted posts, without emitting lifecycle events. It preserves IDs and timestamps and may be run again after interruption. The dry run validates the same primary-language restrictions without writing data. It synchronizes the primary translation from the legacy columns; other languages are preserved.

Set `CANVAS_CONTENT_ENABLED=true` and refresh your configuration cache. The editor now offers a content-language selector. New translations start empty. Saving before switching languages preserves the current changes; a failed save keeps the current language open. Shared fields are edited in the primary language and follow its existing publish/update behavior.

You may disable the feature to return to the current primary content. Other translations remain stored. Before re-enabling, run the transfer command again while writes are stopped to include primary-language edits made while disabled. Changing the primary language after transfer requires a separate data migration. Removing a language from configuration hides it without deleting its content.

### Reading translations

```php
$posts = Post::published('de')->with(['user', 'topic'])->paginate();
$post = Post::forPublicSlug($slug, 'de')->firstOrFail();

// The actual language may be the primary language when fallback was used.
$locale = $post->contentLocale();
```

Without an explicit language, these scopes use Laravel's current locale when supported, otherwise the primary language. They load only published versions for the requested language and its allowed fallback. The selected fields and publication date always come from the same version. If neither is available, the listing excludes the post and the slug lookup returns no result.

`forLocale($locale)` sets the same language context for a custom public query; combine it with `published($locale)` to restrict visibility. Raw `where`, `select`, and `orderBy` calls on the old content columns still target the primary-language mirror. Use the `translations` relationship or Astrotomic's translation query methods for translated fields. Keep unpublished relations and pending data out of your own API resources.

### Writing translations

```php
$post->inLocale('de');
$post->title = 'Ein neuer Beitrag';
$post->body = '<p>Hallo!</p>';
$post->save();

// Astrotomic also exposes explicit translation models.
$post->translateOrNew('de')->summary = 'Eine kurze Zusammenfassung';
$post->save();
```

Model saves persist content directly. Use the Canvas editor for its pending/promote workflow. Save through the parent post to keep the primary-language mirror synchronized atomically. HTML sanitization also applies to translated bodies and pending content.

History retention keeps the newest 50 checkpoints **per language**. Restoring a translation cannot restore another language or overwrite shared fields from a secondary language. Analytics remain aggregated per post, without counting each translation as another article.
