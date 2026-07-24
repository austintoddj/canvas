# Implementation Plan: Media URL Hardening

**Status:** Implemented (clean-break revision — no legacy absolute-host read rewrites)  
**Repo:** `austintoddj/canvas`  
**Triggered by:** Real install smoke test in a fresh host app (`blog`) on Laravel Herd  
**Date:** 2026-07-24  
**Priority:** Pre-release blocker for a confident GA / public beta

> **Implementation note:** Shipped as origin-safe **root-relative** public-disk URLs at rest + absolute expansion for SEO/webhooks. Client `resolveMediaUrl` host-rewrite was **removed**, not centralized into `FadeInImage`. See session plan for the revised approach.

---

## 1. Problem statement

A basic real-world smoke path fails with a broken image icon even when:

- `php artisan storage:link` has been run
- Uploads succeed and files exist under `storage/app/public/canvas/images/`
- Media library UI appears to work
- Package test suite is green

### Reproduction (observed)

1. Install Canvas into a host app served by Herd at `http://blog.test`
2. Leave default `.env` as `APP_URL=http://localhost:8000` (common Laravel starter default)
3. Create + publish a post
4. Upload images to media library
5. Assign a featured image
6. Open the **Posts index** in the Canvas admin SPA

**Result:** Thumbnail broken.  
**Stored value:**

```text
http://localhost:8000/storage/canvas/images/{hash}.jpg
```

**Actual working URL:**

```text
http://blog.test/storage/canvas/images/{hash}.jpg
```

Nothing listens on `:8000`. The file is fine; the **host baked into the absolute URL is wrong**.

### Why this is worse than a docs tip

Canvas already partially anticipates this:

```ts
// resources/js/lib/media/list.ts
// Prefer same-origin URLs for public-disk storage paths so images load when
// APP_URL host/scheme differs from the browser origin (common local misconfig).
export function resolveMediaUrl(...)
```

That helper is used in media grid, featured-image picker, previews, body rewrite, and avatars — but **not** on:

| Surface                | File                                                         | Behavior today       |
| ---------------------- | ------------------------------------------------------------ | -------------------- |
| Posts index thumbs     | `resources/js/pages/Posts/Index.tsx`                         | raw `featured_image` |
| Dashboard recent posts | `resources/js/components/dashboard/DashboardRecentPosts.tsx` | raw `featured_image` |
| Public reader views    | `resources/views/ui/index.blade.php`, `show.blade.php`       | raw `featured_image` |
| SEO / OG               | `src/Support/PostSeo.php`                                    | raw `featured_image` |
| Webhooks               | `src/Support/WebhookPayload.php`                             | raw stored value     |

So the package knows the failure mode and still leaves primary navigation surfaces unprotected. That is a product confidence issue for release, not just “user misconfigured APP_URL.”

---

## 2. Goals

1. **Featured images and library media load in the admin SPA** even when `APP_URL` host/scheme differs from the browser origin (Herd, Valet, Sail, reverse proxy, http vs https).
2. **New writes stop baking a wrong absolute host** into post content where Canvas controls the URL (library media).
3. **Existing bad absolute URLs remain usable** without requiring a DB rewrite for local recovery.
4. **Public reader / SEO consumers** get correct image URLs when the host request is correct, and degrade gracefully for legacy rows.
5. **Automated tests fail** if this class of bug regresses.
6. **Install/upgrade docs** call out `APP_URL` + storage clearly.

## 3. Non-goals

- Migrating historical Canvas majors (Canvas 7 is already a clean break).
- Changing storage disk abstraction or requiring S3 for local installs.
- Rewriting third-party absolute URLs (Unsplash, external CDN, user-pasted remote images).
- Building a full media CDN pipeline or image transforms.
- Auto-detecting / rewriting host `APP_URL` in `.env` (host app concern).
- A full browser e2e suite in this pass (optional follow-up).

---

## 4. Root cause analysis

### Data flow today

```text
Upload file
  → MediaStorage::store()
  → path on public disk: canvas/images/{hash}.jpg
  → Media.url accessor = Storage::disk(...)->url(path)
  → absolute URL using filesystems.disks.public.url (derived from APP_URL)

Pick featured image in SPA
  → selection.url (absolute) stored in posts.featured_image

Render posts index
  → API returns stored absolute URL
  → <img src={thumb}> without resolveMediaUrl
  → browser requests wrong host → broken image
```

### Contributing design choices

1. **Absolute URLs at write time** for `featured_image`, body `<img src>`, and likely `canvas_users.avatar`.
2. **`APP_URL` is the single source of truth** for local public-disk URL generation.
3. **Client mitigation is incomplete** — `resolveMediaUrl` is opt-in per call site.
4. **No package test covers host mismatch** between stored URL origin and request origin.
5. **Docs mention `storage:link`** but do not stress that `APP_URL` must match the browser origin for absolute media URLs.

### Why package tests stay green

- `Storage::fake()` + controlled app URL
- No assertion that list thumbs rewrite `/storage/*` to the current origin
- No install-matrix smoke for Herd/`blog.test` vs `localhost:8000`

---

## 5. Design decisions

### Decision A — Preferred stored form for Canvas-owned public-disk assets

**Store root-relative public URLs** (path starting with `/storage/...`) for library media when the disk is local/`public` (or more generally: when the generated URL’s path is under the disk’s public prefix).

Examples:

| Kind                                                    | Store                                                  |
| ------------------------------------------------------- | ------------------------------------------------------ |
| Library upload on `public` disk                         | `/storage/canvas/images/abc.jpg`                       |
| Unsplash / remote URL                                   | `https://images.unsplash.com/...` (unchanged absolute) |
| Custom remote CDN already absolute and not `/storage/*` | leave absolute                                         |

**Rationale**

- Root-relative URLs are origin-agnostic in browsers and Blade `src`.
- Avoids permanently baking a wrong `APP_URL` into content rows.
- Compatible with existing `resolveMediaUrl` (pathname still starts with `/storage/`).
- Minimal schema change (`featured_image` stays a string URL/path).

**Rejected alternatives**

| Alternative                                                               | Why not now                                                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Store only disk path (`canvas/images/abc.jpg`) and always resolve on read | Cleaner long-term, but wider API/contract change for webhooks, hosts reading raw columns, and body HTML  |
| Always absolute with request host at write time                           | Still wrong for queue workers / CLI rewrites; still breaks if content is later read under another domain |
| Keep absolute + only client rewrite                                       | Masks admin bugs; public Blade/SEO/webhooks still wrong                                                  |

### Decision B — Resolve on the way out (defense in depth)

Even with better writes, **normalize on read** for API/admin payloads and SEO:

1. If value is a `/storage/...` path or absolute URL whose path starts with `/storage/`, treat as Canvas public-disk asset.
2. For **browser/admin display**, prefer same-origin or root-relative form.
3. For **SEO/OG/JSON-LD/webhooks**, expand to an absolute URL using the **current request root** (or `config('app.url')` when no request), not the historical host in the stored string when the path is a local storage path.

### Decision C — Centralize client rewriting

Put `resolveMediaUrl` inside `FadeInImage` (and keep Avatar as-is or share the same path) so list/dashboard cannot forget it again.

Call-site opt-in has already failed once; components that always render media should own the rule.

### Decision D — Back-compat for already-written absolute URLs

Do **not** require a data migration for GA confidence.

- Display/admin: rewrite `/storage/*` absolute URLs to current origin.
- Optional later: `canvas:repair-media-urls` command for hosts who want DB cleanup after domain change.
- New saves: prefer root-relative for library picks.

### Decision E — Scope of body HTML

Body content also embeds absolute image URLs via the editor. Address in the same initiative:

- When inserting library images into the editor, insert root-relative `/storage/...` src when applicable.
- Keep existing `resolveMediaUrl` rewrite when loading body for display/edit.
- Public Blade renders body HTML as stored; root-relative inserts fix reader views without a JS helper.

---

## 6. Target architecture

```text
                    ┌──────────────────────────────┐
                    │ MediaStorage / Media.url     │
                    │  - path: canvas/images/...   │
                    │  - url(): root-relative for  │
                    │    public local disk assets  │
                    │  - absoluteUrl(): for SEO/   │
                    │    webhooks when needed      │
                    └──────────────┬───────────────┘
                                   │
          library pick / avatar / body insert
                                   │
                                   v
                    posts.featured_image  (string)
                    body <img src>        (HTML)
                    canvas_users.avatar   (string)
                                   │
            ┌──────────────────────┼──────────────────────┐
            v                      v                      v
     Admin SPA API          Public Blade UI           PostSeo / Webhooks
     resolve on read        root-relative OK          absolute for consumers
     + FadeInImage rewrite  absolute remote OK        rewrite local storage
```

### New PHP support object (proposed)

`Canvas\Support\MediaUrl` (name flexible):

```php
MediaUrl::publicUrl(string $path): string
// → '/storage/canvas/images/x.jpg' for local public disk
// → full disk URL for s3/custom when absolute is required

MediaUrl::absolute(?string $urlOrPath, ?string $root = null): ?string
// expand root-relative or storage-path URLs for OG/webhooks

MediaUrl::normalizeForDisplay(?string $urlOrPath): ?string
// root-relative for /storage/* ; leave external absolute alone

MediaUrl::isPublicStorageUrl(?string $urlOrPath): bool
```

Wire through:

- `MediaStorage::url()`
- `Media` model `url` accessor
- `PostSeo::resolve()`
- optional resource transformers if posts ever move off raw columns

---

## 7. Work packages (ordered PRs)

### PR 1 — Admin SPA: never show broken local storage thumbs again

**Risk:** Low  
**User-visible:** Fixes the reported smoke failure immediately  
**Ship alone:** Yes (hotfix-quality)

#### Tasks

1. Apply `resolveMediaUrl` inside `FadeInImage` so every consumer benefits.
2. Audit remaining raw `<img src={...}>` / `src={thumb}` for media-like URLs:
    - `pages/Posts/Index.tsx`
    - `components/dashboard/DashboardRecentPosts.tsx`
    - `components/media/ImageSourcePicker.tsx` (Unsplash + library previews)
    - any other list thumbs found by search
3. Keep explicit `resolveMediaUrl` at non-`FadeInImage` sites (FeaturedImagePicker, body, SEO preview) or route them through shared components.
4. Vitest:
    - unit coverage already exists for `resolveMediaUrl`
    - add component-level test if the repo pattern supports it; otherwise assert helper still rewrites absolute `/storage/` hosts
5. Rebuild admin assets (`npm run build`) so published `resources/dist` includes the fix.

#### Acceptance

- With stored featured image `http://localhost:8000/storage/canvas/images/x.jpg` and browser on `http://blog.test`, posts index thumb requests `http://blog.test/storage/canvas/images/x.jpg`.
- External Unsplash URLs are unchanged.

#### Out of scope for PR 1

- Changing what is stored in the DB
- Public Blade / SEO

---

### PR 2 — Server: generate origin-safe media URLs

**Risk:** Medium (API payload shape for media `url` may switch from absolute → root-relative)  
**Depends on:** none strictly; ideally after PR 1  
**Breaking?** Soft — consumers that required fully absolute media URLs without a host base need `absoluteUrl` for SEO/webhooks only

#### Tasks

1. Add `Canvas\Support\MediaUrl` (or extend `MediaStorage`) with:
    - root-relative generation for local public disk
    - absolute expansion helper
    - detection of public storage URLs/paths
2. Change `MediaStorage::url()` / `Media::url` accessor to return **display-safe** URLs (root-relative for local public assets).
3. Ensure S3 / custom disks that only work with absolute object URLs still return usable absolute URLs (do not break remote disks).
4. Normalize featured image **on write** in post save path (and avatar sync if applicable):
    - if incoming URL is Canvas public storage (any host + `/storage/...` path, or known disk path), store root-relative form
    - if Unsplash/external, store absolute unchanged
5. When inserting library images into post body (frontend), prefer the media URL returned by API after PR 2 (root-relative).
6. Pest tests:
    - `MediaStorage` returns root-relative URL under default `public` disk + `APP_URL=http://localhost:8000`
    - absolute helper expands with app url / request root
    - external URLs untouched
    - post store/update normalizes featured_image
7. Media controller feature test: upload response `url` is root-relative for public disk.

#### Acceptance

- Fresh upload + feature image save stores `/storage/canvas/images/...` (or equivalent root-relative), not `http://localhost:8000/...`.
- Media library JSON `url` works when host is opened on any origin that serves the same app.
- S3 disk smoke/unit path still produces a loadable absolute URL.

#### Notes / compatibility

- Document in `.github/UPGRADE.md` that media `url` and new `featured_image` values for library assets may be root-relative.
- Host apps reading `featured_image` for emails/OG should absolute-ize; provide `MediaUrl::absolute()` and use it in `PostSeo` / webhooks.

---

### PR 3 — Public surfaces, SEO, webhooks

**Risk:** Low–medium  
**Depends on:** PR 2 helpers (can land with PR 2 if small enough; prefer separate for review focus)

#### Tasks

1. `PostSeo::resolve()`:
    - if featured image / first body image is local storage, emit absolute URL for OG/Twitter/JSON-LD using current request root or `app.url`
2. `WebhookPayload`:
    - absolute-ize local storage featured images so external subscribers get fetchable URLs
3. Optional `canvas:ui` Blade views:
    - use a small Blade helper / view composer / `@php` call to `MediaUrl::normalizeForDisplay()` for `<img src>`
    - absolute not required for browser img tags; root-relative is ideal
4. Avatar resolution paths: ensure admin + public author partials behave with root-relative avatars.
5. Pest tests for `PostSeo` absolute expansion and webhook payload absoluteization.

#### Acceptance

- Public post page image tags load under Herd with wrong historical absolute rows (via normalize) and with new root-relative rows.
- OG `og:image` is absolute and fetchable when `APP_URL` or request root is correct.
- Webhook consumers receive absolute image URLs for local media.

---

### PR 4 — Docs, install UX, optional repair tooling

**Risk:** Low  
**Depends on:** PRs 1–3 ideally merged so docs match behavior

#### Tasks

1. **readme.md** install section:
    - set `APP_URL` to the exact URL you open in the browser (Herd `https://my-app.test`, not leftover `http://localhost:8000`)
    - keep `php artisan storage:link`
2. **`.github/UPGRADE.md`**:
    - smoke checks: upload → feature image → posts index thumb → public show image
    - troubleshooting: broken images → verify symlink, `APP_URL`, and that URL path is `/storage/...`
    - note root-relative storage URLs for library assets
3. **`canvas:install`** completion bullets:
    - remind about `storage:link` and `APP_URL`
4. Optional: `canvas:doctor` (or extend an existing command) checks:
    - `public/storage` link exists
    - `APP_URL` host parses
    - sample write/read on canvas storage disk (if safe)
5. Optional: `canvas:repair-media-urls --dry-run` to rewrite absolute local storage hosts in:
    - `posts.featured_image`
    - `canvas_users.avatar`
    - optionally scan post bodies for `<img src="http://wrong-host/storage/...">`
6. Manual smoke checklist checked into docs (section below).

#### Acceptance

- A new installer can follow docs only and pass the smoke path on Herd without tribal knowledge.
- Repair command documented as optional cleanup, not required for the SPA fix.

---

### PR 5 — Regression harness for the exact smoke failure

**Risk:** Low  
**Depends on:** PR 1–2

#### Tasks

1. **PHP feature test** (preferred core):
    - Configure `app.url` to `http://localhost:8000`
    - Create media + post with featured image set from media URL helper
    - Assert stored/normalized featured image is root-relative **or** that API list payload normalizes display URL
    - Assert `PostSeo` absolute URL uses configured/request root, not a foreign host if input was foreign absolute `/storage/...`
2. **JS unit test**:
    - `resolveMediaUrl('http://localhost:8000/storage/canvas/images/a.jpg')` equals `` `${origin}/storage/canvas/images/a.jpg` ``
    - already partially present; extend cases for root-relative input and protocol-relative if relevant
3. **Manual matrix** (document; not necessarily CI):

| Host             | APP_URL                 | Browser                 | Expected             |
| ---------------- | ----------------------- | ----------------------- | -------------------- |
| Herd `blog.test` | `http://blog.test`      | `http://blog.test`      | pass                 |
| Herd `blog.test` | `http://localhost:8000` | `http://blog.test`      | pass after this work |
| `artisan serve`  | `http://127.0.0.1:8000` | `http://127.0.0.1:8000` | pass                 |
| `artisan serve`  | `http://localhost:8000` | `http://127.0.0.1:8000` | pass after this work |

4. Optional follow-up: Playwright/Dusk install smoke in a separate repo (`trycanvas` / demo app). Not blocking if Pest covers normalization contracts.

---

## 8. Detailed file touch list (expected)

### Frontend

- `resources/js/components/FadeInImage.tsx`
- `resources/js/pages/Posts/Index.tsx` (may become no-op if FadeInImage owns rewrite)
- `resources/js/components/dashboard/DashboardRecentPosts.tsx`
- `resources/js/components/posts/FeaturedImagePicker.tsx` (verify)
- `resources/js/components/posts/PostBodyEditor.tsx` (insert URL form)
- `resources/js/lib/media/list.ts` (keep; possibly expand docs/tests)
- `resources/js/__tests__/media-list.test.ts`
- `resources/dist/**` (built assets)

### Backend

- `src/Support/MediaStorage.php`
- `src/Support/MediaUrl.php` **(new)**
- `src/Models/Media.php`
- `src/Models/Post.php` and/or post request/lifecycle save normalization
- `src/Support/PostSeo.php`
- `src/Support/WebhookPayload.php`
- `src/Support/AuthorAvatar.php` (if avatar URLs follow same rules)
- `src/Http/Controllers/PostController.php` / resources only if response shaping moves here
- `src/Console/InstallCommand.php`
- optional `src/Console/DoctorCommand.php`, `RepairMediaUrlsCommand.php`

### Views / docs / tests

- `resources/views/ui/index.blade.php`
- `resources/views/ui/show.blade.php`
- `tests/Support/MediaStorageTest.php`
- `tests/Support/MediaUrlTest.php` **(new)**
- `tests/Support/PostSeoTest.php` (extend)
- `tests/Support/WebhookPayloadTest.php` (extend)
- `tests/Http/Controllers/MediaControllerTest.php`
- `tests/Http/Controllers/Post*Test.php` as needed
- `readme.md`
- `.github/UPGRADE.md`
- this plan file (mark status when done)

---

## 9. Implementation notes & edge cases

1. **Laravel `Storage::url()`** often returns absolute URLs when `filesystems.disks.public.url` is absolute. Prefer post-processing via `MediaUrl` rather than fighting framework defaults ad hoc in many places.
2. **Query strings / fragments** on storage URLs must be preserved when rewriting.
3. **Double prefixes** — guard against `/storage/storage/...`.
4. **Windows / subdirectory installs** — if a host serves Laravel under a subdirectory, root-relative `/storage` may be wrong. Confirm whether Canvas supports subdirectory installs today; if not, document as unsupported rather than half-fixing. (Likely out of scope; match existing package assumptions.)
5. **S3 `visibility` / temporary URLs** — do not force root-relative for non-local disks.
6. **Soft-deleted media** — featured_image is a denormalized URL string today; destroying media already can leave orphan featured URLs. Out of scope unless easy to note in troubleshooting.
7. **Column length** — `featured_image` is a `string` column; root-relative is shorter than absolute, so migration not required.
8. **Pending vs live posts** — normalization must apply when writing pending JSON and live columns (`PostSnapshot` paths).
9. **Caches** — no media URL cache known; if any response cache exists in host apps, document that featured image changes need cache busting (host concern).

---

## 10. Test plan

### Automated (required before merge of each PR)

| Layer  | Command                                            | Focus                              |
| ------ | -------------------------------------------------- | ---------------------------------- |
| PHP    | `composer test` / `vendor/bin/pest --filter=Media` | storage URL shape, SEO, webhooks   |
| JS     | `npm test`                                         | `resolveMediaUrl` cases            |
| Assets | `npm run build`                                    | dist updated with SPA fix          |
| Static | `composer lint` / existing CI                      | phpstan clean on new support class |

### Manual smoke (required before calling the initiative done)

On a **fresh** host app (or reset content), with intentional misconfig first:

1. Set `APP_URL=http://localhost:8000` while browsing Herd host (or reverse).
2. `php artisan storage:link`
3. `php artisan canvas:make-admin …`
4. Upload 2 images to media library — grid previews load.
5. Create post, set featured image, publish.
6. Posts index shows thumb (not broken).
7. Dashboard recent posts thumb loads.
8. Editor featured image preview loads.
9. Public `canvas:ui` index/show image loads (if UI published).
10. View page source / meta: `og:image` absolute and correct host for current app.
11. Fix `APP_URL` to real host; re-save a new image; confirm DB stores root-relative for library asset.
12. Repeat once with Unsplash (if configured) to ensure remote absolute URLs still work.

### Explicit failure cases to re-test after fix

- Wrong `APP_URL` host
- `http` APP_URL / `https` browser (Herd SSL)
- `localhost` vs `127.0.0.1`
- Missing `storage:link` (should still fail file 404 — different symptom; docs should distinguish)

---

## 11. Rollout / release strategy

1. Land **PR 1** immediately on the release branch (admin confidence).
2. Land **PR 2 + 3** before public “ready to install” messaging.
3. Land **PR 4** with the same tag notes.
4. Land **PR 5** tests with PR 2 at latest (do not ship URL behavior change without tests).
5. Cut **beta/RC** build; run manual matrix on Herd + `artisan serve`.
6. Only then call GA if no related smoke regressions.

### Release notes blurb (draft)

> Media library and featured images now use origin-safe URLs for local public disk files. This fixes broken thumbnails when `APP_URL` does not match the URL you open in the browser (common with Laravel Herd). Please set `APP_URL` to your real app URL and run `php artisan storage:link`.

---

## 12. Success metrics

- [ ] Reported smoke path passes with deliberate wrong `APP_URL`
- [ ] Posts index + dashboard never use raw un-normalized storage URLs
- [ ] New library featured images persist root-relative (public disk)
- [ ] Unsplash/external URLs unchanged
- [ ] `PostSeo` / webhooks emit absolute URLs for local media
- [ ] Pest + Vitest cover host-mismatch cases
- [ ] Install docs mention `APP_URL` + storage link + smoke thumb check
- [ ] No phpstan / CI regressions

---

## 13. Suggested implementation order for a single engineer

| Day | Focus                                                          |
| --- | -------------------------------------------------------------- |
| 0.5 | PR 1 SPA `FadeInImage` + rebuild assets + manual smoke         |
| 1   | PR 2 `MediaUrl` + MediaStorage + write normalization + Pest    |
| 0.5 | PR 3 SEO/webhooks/Blade                                        |
| 0.5 | PR 4 docs/install messaging (+ optional doctor/repair if time) |
| 0.5 | PR 5 harden tests + full manual matrix on clean host           |

**Total estimate:** ~3 focused days including review polish.  
**Minimum for reduced release anxiety:** PR 1 + PR 2 + tests + docs note.

---

## 14. Open questions (resolve before/during PR 2)

1. **Avatar column contract** — UPGRADE.md currently describes avatar as absolute URL. Confirm we intentionally allow root-relative there too (recommended: yes, same rules as featured image).
2. **Webhook absolute root** — prefer `config('app.url')` always, or `request()->getSchemeAndHttpHost()` when available? Recommendation: request when in HTTP lifecycle; fall back to `app.url` in queues/CLI.
3. **Repair command in v1 of this work?** Recommendation: defer to follow-up unless support load demands it; SPA + root-relative new writes may be enough.
4. **Subdirectory hosting** — declare unsupported if not already supported.

---

## 15. Appendix — evidence from the failing host app

| Check                                                 | Result                                            |
| ----------------------------------------------------- | ------------------------------------------------- |
| Symlink `public/storage`                              | Present → `storage/app/public`                    |
| File on disk                                          | Present JPEG under `canvas/images/`               |
| `GET http://blog.test/storage/canvas/images/...`      | 200                                               |
| `GET http://localhost:8000/storage/canvas/images/...` | unreachable                                       |
| DB `featured_image`                                   | absolute `http://localhost:8000/storage/...`      |
| Host `.env` `APP_URL`                                 | `http://localhost:8000`                           |
| Package tests                                         | green (do not model this mismatch on list thumbs) |

---

## 16. PR Plan summary

| PR  | Title                                                          | Depends on | Outcome                                           |
| --- | -------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| 1   | fix(admin): resolve local storage thumbs via FadeInImage       | —          | Broken posts index fixed for legacy absolute URLs |
| 2   | fix(media): origin-safe public disk URLs + write normalization | —          | Stop writing wrong hosts into content             |
| 3   | fix(public): absolute SEO/webhook URLs; Blade-safe display     | PR 2       | Readers + integrations correct                    |
| 4   | docs: APP_URL/storage smoke + install tips                     | PR 1–3     | Installers avoid the trap                         |
| 5   | test: host-mismatch regression coverage                        | PR 1–2     | Suite fails if this regresses                     |

---

## 17. Key decisions (quick reference)

1. **Root-relative for Canvas public-disk assets** at rest when possible.
2. **Absolute only where consumers need it** (OG, webhooks, remote disks).
3. **Client rewrite is mandatory in shared image components**, not optional per page.
4. **No required data migration** — normalize on read/write instead.
5. **Wrong `APP_URL` remains a host misconfig**, but Canvas must not face-plant on the default Laravel starter value during first-run smoke tests.
