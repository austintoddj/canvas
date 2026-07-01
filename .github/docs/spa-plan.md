# Canvas Admin SPA Development Plan

[//]: # 'TODO: Remove before v7 release. This is a living document for the Canvas v7 admin SPA implementation.'

This document is the implementation blueprint for the React admin SPA shipped in `resources/js/`. It maps every authenticated API route group in `routes/web.php` to SPA pages, user flows, and request/response contracts, and defines a phased build order aligned with the Canvas v7 backend.

**Scope:** Admin dashboard SPA only. Does not cover the optional reader frontend (`resources/views/ui/**`) or host-app authentication.

**v7 posture:** Ship a complete admin experience — post settings, SEO, media library, analytics, and admin workflows. The **rich-text body editor is explicitly deferred**; use a UI placeholder until an editor is chosen.

**How to use this plan:** Work chat-by-chat through the [Implementation tracker](#implementation-tracker) below. When an item ships, change `- [ ]` to `- [x]` in this file. The **next unchecked item** is what to tackle next.

---

## Implementation tracker

### Step 1 — Foundation

- [x] 1.1 — `resources/js/lib/api.ts` fetch wrapper (CSRF, credentials, typed 401/403/422 errors)
- [x] 1.2 — API modules: `posts`, `media`, `users`, `stats`, `search`, `tags`, `topics`, `unsplash`
- [x] 1.3 — `resources/js/types/api.ts` and `types/boot.ts`
- [x] 1.4 — `resources/js/lib/permissions.ts` + Vitest tests
- [x] 1.5 — `resources/js/lib/i18n.ts` (parse boot `translations`)
- [x] 1.6 — `CanvasContext` + `useCanvas` / `usePermissions` hooks
- [x] 1.7 — Register all routes in `router.tsx` with lazy placeholders
- [x] 1.8 — Update `Layout.tsx` (permission-gated nav, hide deferrals, remove static recent posts)
- [x] 1.9 — Vitest + `npm test` + `api.test.ts`

**Step 1 done when:** `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.

### Step 2 — Media upload helper

- [x] 2.1 — `uploadMedia(file)` in `lib/api/media.ts` (`GET /api/media/create` → `POST /api/media/{id}`)
- [x] 2.2 — Validate file size (`window.Canvas.maxUpload`) and MIME types before upload
- [x] 2.3 — Unit test upload flow (mock fetch)

**Step 2 done when:** Media upload helper tested; ready for library page (editor integration comes later).

### Step 3 — Post editor shell (no rich-text editor yet)

- [x] 3.1 — `PostEditorLayout` — main column + right sidebar
- [x] 3.2 — `BodyEditorPlaceholder` — dashed placeholder UI (“Rich text editor coming soon”); no editor dependency
- [x] 3.3 — Create flow: `GET /api/posts/create` → redirect `/posts/{id}`
- [x] 3.4 — Load flow: `GET /api/posts/{id}` — hydrate form state; pass through existing `body` unchanged on save
- [x] 3.5 — `usePostAutosave` — debounced `POST /api/posts/{id}` for sidebar fields + `body` from state
- [x] 3.6 — `PostSidebar` — title, slug, summary, topic, tags
- [x] 3.7 — `PublishPanel` — draft vs published (`published_at` set/clear)

**Step 3 done when:** Author can create a post, edit metadata, autosave, and publish — body unchanged unless a future editor is added.

### Step 4 — Post SEO panel

- [ ] 4.1 — `lib/seo.ts` resolution helpers (see [Post SEO specification](#post-seo-specification))
- [ ] 4.2 — `PostSeoPanel` — SEO title, meta description, canonical URL
- [ ] 4.3 — `SeoPreview` — live SERP + social card previews
- [ ] 4.4 — `FeaturedImagePicker` — media library modal; optional Unsplash tab
- [ ] 4.5 — Wire `meta: { title, description, canonical_link }` on save
- [ ] 4.6 — Unit tests for `lib/seo.ts`

**Step 4 done when:** SEO fields persist; previews update live; featured image drives social preview.

### Step 5 — Posts list and stats

- [ ] 5.1 — `/posts` — published/draft tabs, pagination, scope toggle (Editor+)
- [ ] 5.2 — Row actions: Edit, Stats (published only), Delete
- [ ] 5.3 — `/posts/:id/stats` — charts from `PostInsights`
- [ ] 5.4 — Sidebar recent posts from `GET /api/posts` (limit 5)

**Step 5 done when:** Full post lifecycle works for Contributor and Editor roles.

### Step 6 — Media library

- [ ] 6.1 — `/media` — grid, search, mime filter, scope toggle, upload
- [ ] 6.2 — `/media/:id` — metadata edit, delete
- [ ] 6.3 — `MediaPicker` modal (reused by featured-image picker)

**Step 6 done when:** Upload and browse work independently of the body editor.

### Step 7 — Settings and user admin

- [ ] 7.1 — `/settings` — profile form; apply `dark_mode` to document
- [ ] 7.2 — `/settings/users` — list, grant, revoke, role edit (admin only)
- [ ] 7.3 — Mark `preferences.onboarding.complete` after first meaningful action

**Step 7 done when:** Profile round-trips; admin can grant/revoke access.

### Step 8 — Taxonomy admin (basic CRUD only)

- [ ] 8.1 — `/tags` and `/tags/:id` — name + slug only
- [ ] 8.2 — `/topics` and `/topics/:id` — name + slug; add Topics nav link for admins

**Step 8 done when:** Admin CRUD works; non-admin nav hidden and API returns 403.

### Step 9 — Dashboard and search

- [ ] 9.1 — `/` dashboard — stats cards + 30-day charts
- [ ] 9.2 — Command palette (`⌘K`) — `GET /api/search`
- [ ] 9.3 — Optional `/search` full-page reuse

**Step 9 done when:** Dashboard and search work for all roles with gate-appropriate results.

### Step 10 — CI and publish

- [ ] 10.1 — Add `npm test`, `npm run typecheck`, `npm run build` to GitHub Actions
- [ ] 10.2 — `npm run build` + `php artisan canvas:publish`; smoke-test `/canvas`

**Step 10 done when:** CI green; built assets load in a host app.

### Step E — Body editor (deferred — do not start until editor is chosen)

- [ ] E.1 — Choose editor (Novel, Tiptap, Lexical, etc.) and document `body` format contract (HTML vs JSON)
- [ ] E.2 — Replace `BodyEditorPlaceholder` with real editor component
- [ ] E.3 — Wire inline image upload to `uploadMedia()` helper
- [ ] E.4 — Serialize editor content into `body` on autosave
- [ ] E.5 — Hydrate editor from `body` on load
- [ ] E.6 — Update reader (separate effort) if format contract changes

**Step E done when:** Authors can write and format post body content in the chosen editor.

---

## What to do next

**Right now:** Start at the first unchecked item in the tracker — **4.1** (`lib/seo.ts`).

Work Steps 1–10 in order. Skip **Step E** entirely until you have picked an editor. Each numbered step maps to one PR (or a short stack).

---

## Body editor (deferred)

The post body rich-text editor is **not in scope** for Steps 1–10. Do not install Novel, Tiptap, or any other editor package yet.

### Placeholder component

Create `components/posts/BodyEditorPlaceholder.tsx`:

- Occupies the main column where the editor will eventually live
- Dashed border, muted background, short message: “Rich text editor coming soon”
- Optional subtitle: “Post metadata, SEO, and publishing work today”
- Fixed min-height so the layout matches the final editor shell

### What still works without an editor

| Feature                     | Works? | Notes                                        |
| --------------------------- | ------ | -------------------------------------------- |
| Create / edit post metadata | Yes    | Title, slug, summary, topic, tags            |
| Publish / draft             | Yes    | `published_at`                               |
| SEO panel                   | Yes    | `meta` + previews                            |
| Featured image              | Yes    | Media picker + Unsplash                      |
| Autosave                    | Yes    | Include `body` from loaded state (unchanged) |
| Posts list / stats          | Yes    | Independent of editor                        |
| Edit body content           | No     | Deferred to Step E                           |

### Body field contract (today)

- Backend stores `body` as a nullable string (`PostRequest`: `'body' => 'nullable|string'`).
- Reader renders `{!! $post->body !!}` — HTML is the practical format today.
- Until Step E: load `body` from API into component state; send it back on save without an editing surface.
- When an editor is chosen, document whether `body` stays HTML or moves to another format; update Step E checklist and reader accordingly.

### Post editor layout (current target)

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Posts]   Draft / Published badge          [Save] [Publish ▾] │
├────────────────────────────────────────┬─────────────────────────┤
│                                        │  Post settings          │
│  Title input                           │  ─────────────────      │
│                                        │  Slug + URL preview     │
│  ┌──────────────────────────────────┐  │  Summary                │
│  │  BodyEditorPlaceholder           │  │  Topic (combobox)       │
│  │  (editor slots in here later)    │  │  Tags (multi combobox)  │
│  └──────────────────────────────────┘  │                         │
│                                        │  Featured image         │
│                                        │  [Media] [Unsplash?]    │
│                                        │  SEO panel              │
└────────────────────────────────────────┴─────────────────────────┘
```

### Autosave behaviour

- Debounce 2–3 seconds after last field change (sidebar fields only for now).
- Save via `POST /api/posts/{id}` with full payload (not PATCH).
- Show save state: idle → saving → saved → error.
- On 422, map `errors` to field-level messages.
- On navigation away with unsaved changes, confirm dialog.

### Tags and topics in the post shell

Authors assign tags/topics from the sidebar (API auto-creates unknown slugs on save). Admin `/tags` and `/topics` pages are for management only. No taxonomy SEO.

### Image surfaces (for when editor arrives)

| Surface        | Field            | Integration point                        |
| -------------- | ---------------- | ---------------------------------------- |
| Inline images  | `body`           | Step E — editor upload → `uploadMedia()` |
| Featured image | `featured_image` | Step 4 — sidebar picker (ships now)      |
| Social preview | Derived          | Step 4 — from `featured_image`           |

Unsplash (`GET /api/unsplash`) is for the **featured-image picker only**, not inline body images.

---

## Post SEO specification

SEO work is **admin SPA only** for v7. The reader frontend will consume stored values later. Tag and topic archive SEO is **out of scope**.

### Stored fields (existing API)

| Field                    | Type   | Purpose                                  |
| ------------------------ | ------ | ---------------------------------------- |
| `title`                  | string | Post headline (H1 on reader)             |
| `summary`                | string | Deck/subtitle; fallback meta description |
| `slug`                   | string | URL segment; unique per author           |
| `featured_image`         | string | Hero + social preview image              |
| `featured_image_caption` | string | Hero caption + `alt` fallback            |
| `meta.title`             | string | SEO `<title>` override                   |
| `meta.description`       | string | Meta description override                |
| `meta.canonical_link`    | string | Canonical URL override                   |

### Resolution chain (`lib/seo.ts`)

```ts
function resolvePostSeo(post: Post, publicBaseUrl: string): ResolvedSeo {
    return {
        title: post.meta?.title || post.title,
        description: post.meta?.description || post.summary || truncate(stripHtml(post.body), 160),
        canonicalUrl: post.meta?.canonical_link || `${publicBaseUrl}/posts/${post.slug}`,
        imageUrl: post.featured_image || firstImageSrc(post.body),
        imageAlt: post.featured_image_caption || post.title,
    };
}
```

### SPA UI requirements

| Control              | Behaviour                                               |
| -------------------- | ------------------------------------------------------- |
| **SEO title**        | Bound to `meta.title`; hint at 60 chars                 |
| **Meta description** | Bound to `meta.description`; hint at 160 chars          |
| **Canonical URL**    | Bound to `meta.canonical_link`; validate when non-empty |
| **Slug**             | `alpha_dash`; live URL preview                          |
| **SERP preview**     | Resolved title + description + URL                      |
| **Social preview**   | Resolved image + title + description                    |
| **Reset overrides**  | Clear `meta.*` to revert to defaults                    |

### Reader handoff (later)

Reader should emit `<title>`, description meta, canonical, Open Graph, Twitter Card, and Article JSON-LD from the same resolution rules. No backend changes needed.

---

## Current state and gaps

| Area               | Status                               |
| ------------------ | ------------------------------------ |
| **Routing**        | Only `/` and `/posts` registered     |
| **Pages**          | Dashboard and Posts index are stubs  |
| **Editor**         | None — placeholder only until Step E |
| **SEO UI**         | None — backend `meta` JSON unused    |
| **API client**     | None                                 |
| **Frontend tests** | None                                 |
| **i18n**           | Boot `translations` not consumed     |

### Layout links without backend

| Link                                | Disposition         |
| ----------------------------------- | ------------------- |
| Inbox, Support, Changelog, Feedback | Defer / hide        |
| Privacy policy, Logout              | Host handoff        |
| Recent Posts sidebar                | Replace in Step 5.4 |

---

## v7 integration constraints

### `window.Canvas` boot payload

| Key            | Purpose                                      |
| -------------- | -------------------------------------------- |
| `path`         | Router basename + API prefix                 |
| `maxUpload`    | Media upload size limit                      |
| `roles`        | `{ 1: Contributor, 2: Editor, 3: Admin }`    |
| `translations` | JSON `canvas::app` strings                   |
| `unsplash`     | Non-null enables featured-image Unsplash tab |
| `user`         | `UserResource` with nested `user.canvas`     |

### CSRF and session fetch

- Base: `` `${window.Canvas.path}/api` ``
- `credentials: 'same-origin'`
- `X-CSRF-TOKEN` on mutating requests
- FormData for media upload (no manual `Content-Type`)

### Role and gate UI

| Gate / policy       | Effect                            |
| ------------------- | --------------------------------- |
| `manage-users`      | Admin user admin                  |
| `manage-taxonomy`   | Admin tags/topics                 |
| `viewAll` (Editor+) | `?scope=all` on posts/media/stats |

---

## API route inventory

Base: `{window.Canvas.path}/api`. All routes require auth + `canvas_users` row.

| Group          | Key routes                       | SPA surfaces                   |
| -------------- | -------------------------------- | ------------------------------ |
| `stats`        | `GET /api/stats`                 | Dashboard `/`                  |
| `translations` | `GET /api/translations/{locale}` | Boot + locale switch           |
| `unsplash`     | `GET /api/unsplash`              | Featured-image picker tab      |
| `media`        | CRUD + upload                    | `/media`, picker modals        |
| `posts`        | CRUD + `/{post}/stats`           | `/posts`, `/posts/:id`, stats  |
| `tags`         | CRUD (admin)                     | `/tags`                        |
| `topics`       | CRUD (admin)                     | `/topics`                      |
| `users`        | CRUD + profile                   | `/settings`, `/settings/users` |
| `search`       | `GET /api/search`                | Command palette                |

### Posts store payload (key fields)

| Field                                      | Notes                                       |
| ------------------------------------------ | ------------------------------------------- |
| `title`, `slug`                            | Required                                    |
| `summary`                                  | Deck + SEO fallback                         |
| `body`                                     | String — pass-through until Step E          |
| `published_at`                             | `null` = draft                              |
| `featured_image`, `featured_image_caption` | Hero / social                               |
| `meta`                                     | `{ title?, description?, canonical_link? }` |
| `tags`, `topic`                            | `[{ name, slug }]`                          |

---

## Proposed SPA route table

| Route                      | Component          | Step |
| -------------------------- | ------------------ | ---- |
| `/`                        | `Dashboard`        | 9    |
| `/posts`                   | `Posts/Index`      | 5    |
| `/posts/new`               | `Posts/Editor`     | 3    |
| `/posts/:id`               | `Posts/Editor`     | 3–4  |
| `/posts/:id/stats`         | `Posts/Stats`      | 5    |
| `/media`                   | `Media/Index`      | 6    |
| `/media/:id`               | `Media/Show`       | 6    |
| `/tags`, `/tags/:id`       | `Tags/*`           | 8    |
| `/topics`, `/topics/:id`   | `Topics/*`         | 8    |
| `/settings`                | `Settings/Profile` | 7    |
| `/settings/users`, `…/:id` | `Settings/Users/*` | 7    |
| `/search`                  | `Search`           | 9    |

---

## Shared frontend architecture

```
resources/js/
├── lib/
│   ├── api.ts
│   ├── api/              # posts, media, users, …
│   ├── seo.ts
│   ├── permissions.ts
│   └── i18n.ts
├── components/
│   ├── posts/
│   │   ├── BodyEditorPlaceholder.tsx   # ← placeholder until Step E
│   │   ├── PostEditorLayout.tsx
│   │   ├── PostSidebar.tsx
│   │   ├── PostSeoPanel.tsx
│   │   ├── SeoPreview.tsx
│   │   ├── FeaturedImagePicker.tsx
│   │   └── PublishPanel.tsx
│   ├── media/MediaPicker.tsx
│   └── search/CommandPalette.tsx
├── hooks/usePostAutosave.ts
├── pages/…
└── __tests__/…
```

No `components/editor/` directory until Step E.

---

## Verification strategy

| Command             | When                   |
| ------------------- | ---------------------- |
| `npm run typecheck` | Every PR               |
| `npm run lint`      | Every PR               |
| `npm test`          | Every PR (from Step 1) |
| `npm run build`     | Every PR               |

### Smoke matrix (Steps 1–10, no editor)

| Role        | Path               | Expected                                                  |
| ----------- | ------------------ | --------------------------------------------------------- |
| Contributor | `/posts`           | Create draft; metadata saves                              |
| Contributor | `/posts/:id`       | SEO panel + featured image work; body placeholder visible |
| Editor      | `/posts?scope=all` | All authors' posts                                        |
| Admin       | `/settings/users`  | Grant/revoke access                                       |

---

## Non-goals

- Rich-text body editor (Step E — deferred)
- Reader frontend SEO rendering
- Tag/topic taxonomy SEO
- Host-app auth (login/logout)
- New Laravel API endpoints
- Inbox, support, changelog, feedback backends

---

## Reference files

| Concern           | Source                                                       |
| ----------------- | ------------------------------------------------------------ |
| API routes        | `routes/web.php`                                             |
| Post validation   | `src/Http/Requests/PostRequest.php`                          |
| Post `meta` shape | `database/factories/PostFactory.php`                         |
| Boot payload      | `src/Support/FrontendBootData.php`                           |
| Roles / gates     | `src/Enums/Role.php`, `src/CanvasServiceProvider.php`        |
| v7 upgrade        | `.github/UPGRADE.md`                                         |
| Current SPA       | `resources/js/router.tsx`, `resources/js/layouts/Layout.tsx` |
