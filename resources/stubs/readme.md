# Building with Canvas (headless guide)

Canvas is a **headless publishing package** for Laravel. Authors write in the admin SPA (`/canvas` by default). Readers never have to use that UI — you own the public surface.

This guide is for host-app developers who want to:

- Publish the optional starter reader (**Canvas UI**)
- Query posts, tags, topics, and authors from Eloquent
- Render post bodies safely (HTML, images, embeds)
- Integrate via webhooks instead of (or in addition to) polling
- Understand how the **admin JSON API** differs from the public reader path

It lives next to the `canvas:ui` stubs on purpose: Canvas UI is optional; this doc is the companion for that path and for fully custom frontends.

---

## Mental model

| Layer | What it is | Who uses it |
| ----- | ---------- | ----------- |
| **Admin SPA** | React app at `/{canvas.path}` (default `/canvas`) | Authors, editors, admins |
| **Admin JSON API** | Authenticated routes under `/{path}/api/*` | The SPA only (session + Canvas access) |
| **Data layer** | Eloquent models (`Post`, `Tag`, `Topic`, `CanvasUser`, …) | Your reader, API, jobs, Tinker |
| **Canvas UI** | Optional Blade starter at `/canvas-ui` | Demo blog or starting point |
| **Webhooks** | Outbound HTTPS on public lifecycle events | Zapier, CDN purge, your API |

**Headless rule:** the source of truth for published content is the **database**, not the admin UI. Your frontend should read models (or a host API you build on top of them). Do not call the admin JSON API from the public site — it requires login and Canvas authorization.

```text
┌─────────────────┐     auth      ┌──────────────────┐
│  Admin SPA      │ ───────────► │  /canvas/api/*   │
│  /canvas        │              │  (session)        │
└─────────────────┘              └────────┬─────────┘
                                          │ writes
                                          ▼
                                 ┌──────────────────┐
                                 │  canvas_* tables │
                                 └────────┬─────────┘
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
            ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
            │ Eloquent in  │    │ canvas:ui Blade │    │  Webhooks    │
            │ your app /   │    │ or Next/Nuxt/…  │    │  (no body)   │
            │ custom API   │    │                 │    │              │
            └──────────────┘    └─────────────────┘    └──────────────┘
```

---

## Quick start: optional Canvas UI

```bash
php artisan canvas:ui
```

That command:

1. Publishes Blade views (`resources/views/vendor/canvas/ui` when customized, otherwise package views)
2. Copies a controller stub → `app/Http/Controllers/Canvas/CanvasUiController.php`
3. Copies routes → `routes/canvas-ui.php`
4. Appends `require __DIR__.'/canvas-ui.php';` to `routes/web.php` if missing

Then open **`/canvas-ui`**.

Use `--force` to overwrite previously published views/controller.

| Route name | Path | Purpose |
| ---------- | ---- | ------- |
| `canvas-ui.index` | `/canvas-ui` | Paginated published posts |
| `canvas-ui.show` | `/canvas-ui/{slug}` | Single post (+ view/visit tracking middleware) |
| `canvas-ui.feed` | `/canvas-ui/feed` | RSS |
| `canvas-ui.tags` / `.tag` | `/canvas-ui/tags`, `…/tags/{slug}` | Tag index / archive |
| `canvas-ui.topics` / `.topic` | `/canvas-ui/topics`, `…/topics/{slug}` | Topic index / archive |
| `canvas-ui.author` | `/canvas-ui/@{username}` | Author archive (`canvas_users.username`) |

The controller stub is intentionally thin: Eloquent queries + views + `PostViewed` on show. Treat it as a template you own after publish.

---

## Querying content (the headless way)

Prefer Eloquent in your host app. Models live under `Canvas\Models\`.

### Published posts

```php
use Canvas\Models\Post;

$posts = Post::published()
    ->with(['user', 'topic', 'tags'])
    ->latest()
    ->paginate();

$post = Post::published()
    ->with(['user', 'tags', 'topic'])
    ->firstWhere('slug', $slug); // or abort 404
```

| Scope | Meaning |
| ----- | ------- |
| `Post::published()` | `published_at` is set and **≤ now** |
| `Post::draft()` | No `published_at`, or `published_at` **in the future** (scheduled) |

Scheduled posts are **draft** until their time passes. There is no separate “scheduled” scope; time is the gate.

### Important fields on `Post`

| Column / attribute | Notes |
| ------------------ | ----- |
| `id` | UUID string (not auto-increment) |
| `slug` | Unique per `user_id` |
| `title`, `summary` | Plain text |
| `body` | **HTML** from the TipTap editor (see [Post body HTML](#post-body-html)) |
| `published_at` | `null` = draft; future = scheduled; past/now = live |
| `featured_image` | URL or root-relative `/storage/…` path |
| `featured_image_caption` | Alt / caption |
| `meta` | JSON SEO bag (`title`, `description`, `canonical_link`, …) |
| `pending` | JSON blob of **unpublished edits** on a live post (editor only) |
| `read_time` | Appended attribute from body length |
| `has_pending_changes` | Whether `pending` is non-empty |
| `user_id` | Host user id (`config('canvas.user_model')`) |
| `topic_id` | Optional topic |

**Live snapshot vs pending:** Once a post is published, ordinary admin autosaves write **`pending` only** and leave public columns alone. Readers must use the live columns (`title`, `body`, …), not `pending`. Promote/publish in the admin is what merges pending into the public snapshot.

### Tags, topics, authors

```php
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\CanvasUser;

$tag = Tag::firstWhere('slug', $slug);
$posts = $tag->posts()->published()->with(['user', 'topic'])->latest()->paginate();

$topic = Topic::firstWhere('slug', $slug);
$posts = $topic->posts()->published()->with(['user', 'tags'])->latest()->paginate();

// Author profile + posts (username is on canvas_users, not the host users table)
$canvasUser = CanvasUser::query()->where('username', $username)->firstOrFail();
$posts = Post::query()
    ->where('user_id', $canvasUser->user_id)
    ->published()
    ->latest()
    ->paginate();
```

Attach Canvas profile data to host users when rendering bylines (the UI controller stub does this with a small helper). Useful fields on `CanvasUser`: `username`, `summary`, `avatar`, `website`, `social`, `locale`, `timezone`, `role`.

### SEO helpers

```php
use Canvas\Support\PostSeo;

$seo = PostSeo::resolve($post, url()->current());
// title, description, canonical_url, image_url, image_alt
```

Canvas UI’s show view uses this for meta tags and JSON-LD. Reuse it in a custom frontend.

### Analytics (optional)

On the public show route, the starter fires:

```php
event(new \Canvas\Events\PostViewed(
    post: $post,
    ip: request()->ip(),
    agent: request()->userAgent(),
    referer: request()->header('referer'),
));
```

`Canvas\Http\Middleware\Session` (applied on `canvas-ui.show`) prunes stale view/visit session keys so counts stay sensible. If you build your own show route and want Canvas stats, fire `PostViewed` the same way and apply similar session hygiene.

---

## Post body HTML

`post.body` is **HTML**, not Markdown. The admin editor (TipTap) produces a constrained subset of tags. That HTML is what you store and what readers should receive.

### Principles

1. **Body is the public contract** — not the admin CSS, not ProseMirror chrome.
2. Render with your design system; Canvas UI’s Tailwind/`prose` classes are only a starter.
3. Trust level: body is written by authenticated Canvas users, not anonymous visitors. Still escape titles/summaries; body is intentionally unescaped HTML (`{!! $post->body !!}` in Blade).
4. Prefer **data attributes** and real iframe `src` values over Canvas-private class names when styling embeds.

### Common block types

| Content | Typical markup |
| ------- | ---------------- |
| Paragraphs, headings, lists, quotes | Standard HTML (`p`, `h1`–`h3`, `ul`/`ol`, `blockquote`, …) |
| Links | `a` with `href` |
| Images | `img.canvas-post-body-image` (often root-relative `/storage/…`) |
| Unsplash credit | following `p.canvas-post-body-image-credit` |
| Code | `pre.canvas-post-body-code` / `code` |
| Tables | `table.canvas-post-body-table` |
| Audio | `audio.canvas-post-body-audio` with `controls` |
| YouTube | `div[data-youtube-video] > iframe` (usually youtube-nocookie embed URL) |
| Vimeo / generic video | `div[data-canvas-iframe][data-layout="video"] > iframe` |
| X / Twitter cards | `div[data-canvas-iframe][data-layout="card"] > iframe` (`platform.twitter.com/embed/Tweet.html?id=…`) |

### Recommended CSS (video + cards)

**Canvas UI:** already included via `ui/partials/embeds.blade.php` (no copy-paste needed).

**Custom frontend:** you do **not** need the full admin stylesheet. Minimal public CSS is the same rules as that partial — 16:9 for `div[data-youtube-video]` / `[data-layout="video"]`, max-width ~550px for `[data-layout="card"]`, responsive images. Wrap body HTML in a root with class `canvas-post-body` (or map the selectors to your own class). See the partial for the full ruleset.

### X / Twitter height (required for full cards)

Cross-origin tweet iframes **do not** expand with CSS alone. Portrait and media-heavy posts look cropped until something applies the height Twitter reports via `postMessage`.

**Canvas UI (included):** `resources/views/ui/partials/embeds.blade.php` ships CSS for video/cards plus a small inline resize listener. The show template wraps body HTML in `.canvas-post-body`. After `php artisan canvas:ui`, embeds work with no extra assets.

**Admin SPA:** the same behavior lives in `resources/js/lib/posts/iframe-resize.ts`.

**Custom frontend:** reuse that pattern (or copy the partial’s script) after injecting body HTML. Without resize JS, stored markup is still valid but X cards stay short.

### Media URLs

Uploads use `config('canvas.storage_disk')` and `storage_path` (defaults: `public` disk, `canvas/` prefix). Bodies and featured images often store **root-relative** paths like `/storage/canvas/…` so they work across hosts. Ensure `php artisan storage:link` and that your CDN/app serves that path. Helpers such as `Canvas\Support\MediaUrl` / `PostSeo` expand to absolute URLs when needed (e.g. Open Graph, webhooks).

### XSS and sanitization

- Titles, summaries, tag names: always escape (`{{ }}`).
- Body: HTML from trusted editors. If you re-expose body through a **public write API** later, sanitize. For classic Canvas (admin-only writes), unescaped body is expected.
- Do not run arbitrary scripts from body; the editor does not intend to store `<script>`.

---

## Admin JSON API (SPA, not public)

Base URL: `/{canvas.path}/api` (default `/canvas/api`).

Middleware stack (package routes):

- `config('canvas.middleware')` (default `web`)
- `auth:{canvas.guard}`
- Canvas user eager-load + **Authorize** (must have a `canvas_users` row / access)

Expect **session cookies** and CSRF for mutating requests, same as a normal Laravel SPA — not a public bearer-token API.

### Posts (high level)

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/posts` | Paginated list; `?type=draft` vs published; counts |
| `GET` | `/posts/create` | Empty post shell + tag/topic catalogs |
| `GET` | `/posts/{id}` | Full post payload for the editor |
| `POST` | `/posts/{id}` | Create/update (UUID in path); `promote`, `publish_now` flags |
| `POST` | `/posts/{id}/discard` | Clear `pending`, keep live snapshot |
| `GET` | `/posts/{id}/stats` | Insights (published only) |
| `DELETE` | `/posts/{id}` | Soft delete |

List responses hide the full `pending` blob but expose `has_pending_changes`. Detail responses include editor fields the SPA needs.

Other authenticated prefixes: `media`, `tags`, `topics`, `users`, `stats`, `search`, `integrations`, `unsplash`, `ai/rewrite`, `translations/{locale}`.

**Do not** use these endpoints as your public blog API. Build a thin host controller or Inertia/Livewire/Next data layer on Eloquent instead. That keeps auth, caching, and response shape under your control.

---

## Webhooks (event-driven headless)

Configure in **Admin → Integrations → Webhooks**. Lifecycle events (publish, schedule, update, unpublish, delete) POST signed JSON to your HTTPS URL. Payloads include metadata (slug, title, summary, featured image, SEO meta, topic/tags, author) — **not** the full HTML body.

Typical flow:

1. Receive `post.published` / `post.updated`
2. Fetch full post in your app (`Post::published()->where('slug', …)` or by id)
3. Revalidate cache / rebuild static page / purge CDN

See [.github/UPGRADE.md](../../.github/UPGRADE.md) (Webhooks section) for event ids, signature verification (`Canvas-Signature`), and queue requirements.

---

## Roles and access

Canvas access is a row in `canvas_users` linked to your host user model.

| Role | Intent |
| ---- | ------ |
| Contributor | Write/manage own posts (publish rules depend on policies) |
| Editor | Broader post access |
| Admin | Users, taxonomy, integrations, full access |

Grant access: `php artisan canvas:make-admin you@example.com` (and related role commands as documented in the main readme / upgrade notes). Host auth (login/logout) stays yours; Canvas only checks “is this authenticated user a Canvas user?”

---

## Configuration touchpoints

Relevant `config/canvas.php` keys for frontends and hosts:

| Key | Default | Relevance |
| --- | ------- | --------- |
| `path` | `canvas` | Admin SPA mount |
| `domain` | `null` | Optional admin subdomain |
| `user_model` | `App\Models\User` | Author relation |
| `guard` | `web` | Auth guard for admin |
| `storage_disk` / `storage_path` | `public` / `canvas` | Media URLs in body |
| `middleware` | `['web']` | Extra middleware on admin routes |

Reader routes from `canvas:ui` are **host** routes (`web` middleware); they do not use the Canvas admin path prefix.

---

## Custom frontend recipes

### Blade (customize Canvas UI)

1. `php artisan canvas:ui`
2. Edit `app/Http/Controllers/Canvas/CanvasUiController.php`
3. Publish or override views under `resources/views/vendor/canvas/ui`
4. Keep `Post::published()`, SEO helper, and `PostViewed` unless you replace analytics

### Laravel API for a separate SPA (Next, Nuxt, mobile)

```php
// routes/api.php — example, you own this
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

Never expose `pending` or host user secrets. Expand media URLs if the SPA is on another origin.

### Static / SSG

On webhook `post.published` / `post.updated`, rebuild the page for that slug. On `post.unpublished` / `post.deleted`, remove it. Poll `Post::published()` if you do not use webhooks.

---

## What Canvas UI is (and is not)

**Is**

- A publishable starter so you can read posts without inventing routing
- An example of correct Eloquent usage, SEO meta, RSS, and view tracking
- Optional and fully overwritable in the host app

**Is not**

- Required for Canvas to work
- A theming system or multi-tenant public CMS
- A substitute for designing your product’s frontend
- The place where “real” content lives (the database is)

---

## Checklist for a solid headless integration

- [ ] Query with `Post::published()` (and friends); ignore `pending` on the public side
- [ ] Escape non-HTML fields; render `body` as HTML intentionally
- [ ] Serve `/storage` (or your disk) for images in body and featured image
- [ ] Style embeds; size X cards with resize JS
- [ ] Use `PostSeo` (or equivalent) for meta tags
- [ ] Fire `PostViewed` if you want Canvas stats
- [ ] Prefer webhooks + Eloquent over scraping the admin API
- [ ] Keep Canvas UI or delete the routes if unused — no half-linked stubs in production

---

## Related files in this package

| Path | Role |
| ---- | ---- |
| `resources/stubs/controllers/CanvasUiController.stub` | Published controller |
| `resources/stubs/routes/canvas-ui.stub` | Published routes |
| `resources/views/ui/*` | Default Blade templates |
| `src/Console/UiCommand.php` | `canvas:ui` implementation |
| `src/Models/Post.php` | Post model + scopes |
| `src/Support/PostSeo.php` | SEO resolution |
| `resources/js/lib/posts/embeds.ts` | URL → embed `src` (editor) |
| `resources/js/lib/posts/iframe-resize.ts` | X card height (admin; copy pattern for public) |
| `.github/UPGRADE.md` | Webhooks, config, upgrade notes |
| `readme.md` | Install and high-level product overview |

---

## Feedback

If something in this guide drifts from the package (new embed types, public embed assets, API shapes), treat the source and tests as authoritative and update this file in the same PR when you change the headless contract.
