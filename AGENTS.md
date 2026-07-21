# AGENTS.md

## Project Context

Canvas is a Laravel package that adds a full blog/publishing system to an existing Laravel application.

## Living standards (how this file relates to plans)

This file is the **durable coding standard** for Canvas. Implementation plans are tactical and must not drift from it.

| Document                                             | Role                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| **`Agents.md` (this file)**                          | Always-on rules for how we write, test, and ship code          |
| [`.github/UPGRADE.md`](.github/UPGRADE.md)           | Host contract, Canvas 7 clean-break install, support notes     |
| [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) | Contributor setup, support window, FormRequest major checklist |

**Rules for agents and humans working plans:**

1. **Every** tracker item is implemented under these standards — not just “what the tracker says,” but _how_ it is written.
2. When product/architecture decisions land, implement them in code **and** keep this file (or UPGRADE) updated if the decision is durable.
3. Prefer this file for permanent style/quality philosophy; UPGRADE for host integration and ordered host-facing work.
4. If a plan step would violate this file, fix the approach (or update this file first) — do not ship exceptions quietly.

## Core Rules

### Avoid Redundancy

- Before implementing any new feature, class, method, or UI component, **search the codebase** for similar existing functionality.
- If something similar exists, extend or refactor it instead of duplicating.
- Explicitly state in your reasoning: "Checked for existing X in src/..., found Y, decided to Z because..."

### Laravel Modernization Standards

- Target modern Laravel practices for Laravel 11, 12, and 13 (use attributes over service providers where possible, readonly classes/properties, typed properties, enums, match expressions, etc.).
- Prefer Laravel's built-in features over custom implementations.
- Use `laravel/pint` for formatting. Run it on changed files.
- Follow PSR-12 + Laravel Pint rules strictly.
- Prefer dependency injection and service classes over fat controllers or static facades where it improves testability/clarity.
- Update tests alongside code changes.
- Use descriptive names for variables and methods. For example, isRegisteredForDiscounts, not discount().
- Check for existing components to reuse before writing a new one.

### Commenting philosophy (Taylor Otwell / Laravel)

Follow this **strictly** for PHP and TypeScript/React (and any other code we ship):

- **Default to writing zero comments.** Excellent code should not need them.
- **Only** add a comment when it explains something the code cannot say by itself. That usually means:
    - Non-obvious design decisions or trade-offs
    - Important business/domain rules that are not encoded in the code
    - Performance considerations or subtle gotchas
    - Complex logic that would be hard to follow even with good naming
- **Never** write comments that narrate what the code does (e.g. `// Get the user`, `// Loop through results`, `// Check if exists`). If you feel the urge, the naming is still weak — improve the names instead.
- Prefer small, well-named methods and strong typing over comments.
- Use PHPDoc (or TSDoc) on public APIs **when it adds real value** (generics, non-obvious contracts, host-facing seams). Avoid noise inline comments.
- Write for the reader six months from now (including future you). If a comment is obvious, stale, or replaceable by better structure, **remove it**.

When touching existing code: do not leave behind narrative comments; clean them up if you are already editing the area.

### Testing Standards

- Use Pest for tests. Prefer function-style tests, `dataset()`s, and shared setup in `tests/Pest.php`.
- Keep `tests/TestCase.php` focused on Testbench/package environment setup only.
- Architecture tests live in `tests/ArchitectureTest.php` — update them when structural rules change.
- Run the relevant Pest file first while iterating, then run the full parallel suite before finishing.
- Frontend: Vitest for SPA unit tests; keep them next to meaningful behavior, not snapshot noise.

### Quality gates (keep green)

- **PHP:** `composer pint:test`, `composer lint` (PHPStan level 6 via Larastan), `composer test` / `test:ci`.
- **JS/SPA:** `npm run typecheck`, `npm run lint`, `npm test`; `npm run build` before PR/release when assets change.
- Do not leave PHPStan or the test suite red after backend/SPA work. Fix analysis and tests in the same pass as the feature.
- Larastan must scan package migrations (`databaseMigrationsPath` in `phpstan.neon.dist`) so Eloquent models stay typed.

### Documentation Files

- You must only create documentation files if explicitly requested by the user.
- Product/install docs: keep `readme.md` simple. Host contracts and upgrade detail belong in `UPGRADE.md` — not the readme.

### Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

### Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

### Package doctrine (backend v7)

- Canvas is a **guest publishing layer**: host owns auth; Canvas owns `canvas_*` tables and admin authorization.
- **Default Laravel first:** bigint host `user_id` FKs, single `canvas.guard`, `user_model` config only — refuse infinite user-schema knobs.
- **Optional gifts:** `HasCanvasAccess` (host sugar) and `canvas:ui` (sample reader). Core paths (API, gates, digest, policies) must work with a bare host `User`.
- **Dependencies:** prefer Illuminate primitives (`Str::uuid()`, etc.); no transitive-only critical packages.
- Prefer class-based factories and `Model::factory()` over legacy `factory()` helpers.
- **Taxonomy from the post editor:** **attach existing** tags/topics only, via Catalyst **Dropdown** menus (same pattern as the editor toolbar More menu — `cursor-pointer`, checkmarks for selection). No free-typed minting in the post settings drawer; Organize remains the place to create taxonomy deliberately.
- **Author profile vs access:** Authors own bio, username, avatar, website, socials, **language** (BCP-47 `locale` on `canvas_users`), timezone, and digest via a **profile drawer** (avatar menu or self in Users) — not a standalone `/settings` page. Admins managing **other** users only change **role** and **revoke access**. API enforces the same: self may not set `role`; admin-on-other payloads are role-only. Language and timezone are Canvas-owned profile fields (host `app.*` config is fallback only).
- **Avatar:** Absolute URL only (media library / Unsplash picker in the profile drawer). Empty avatar → `null` `avatar_url` → initials in UI. No Gravatar.
- **Media grids:** Library and Unsplash use **justified rows** (variable aspect, flush rows), not uniform square tiles. Unsplash tiles are image-only (credit in alt/caption, not under-grid chrome).

### Artisan command naming

- All commands live under the `canvas:` namespace and follow Laravel core conventions.
- **Nouns for resource inspection**, mirroring `db:table {table?}`: e.g. `canvas:users {user?}` lists all users bare, shows one with an argument. Do not add `list-*`/`show-*` command pairs.
- **Verbs for actions with side effects**: `canvas:make-admin`, `canvas:assign-role`, `canvas:remove-access`, `canvas:install`, `canvas:migrate`, `canvas:publish`.
- Keep package-specific request base classes in `src/Http/Requests/` when they are needed to avoid framework coupling.
- Prefer the smallest practical set of `illuminate/*` packages.
- Respect the existing structure (`src/`, `config/`, `resources/`, etc.) unless intentionally refactoring.
- Maintain backward compatibility where reasonable; keep the distraction-free writing philosophy intact.

### SPA loading UX (admin React)

Durable patterns for list pages and media (set by the media library; reuse elsewhere):

- **Stable chrome** — shell, page header, filters, and primary actions appear immediately and never blank while data loads. Do not rise/fade known chrome on route change.
- **Route transitions** — `AnimatedOutlet` swaps route bodies **instantly** (no whole-page opacity or Y motion). Hard refresh stays skeleton-first via Suspense/`PageFallback`. Never invent artificial wait for data that is already ready.
- **Skeletons** — when `isInitialLoading` (loading + no items), show a layout-matched skeleton **with no entrance motion**. Same rules for hard refresh and SPA navigation — decide from `loading` + `itemCount`, not navigation type.
- **Filled content** — wrap list bodies/grids in `ContentReveal` (opacity-only settle ~150ms, `busy` dim while refetching). No vertical travel. Pass `animate={false}` when re-settling without a skeleton→data transition (see `useAsyncReveal` / `nextRevealAnimation`).
- **Empty states** — only when `shouldShowEmpty` (`!loading` + zero items), wrap in `EmptyStateReveal`. Soft lift (~200ms / 8px) only when the list previously had items (e.g. last delete). **Never** lift after initial skeleton→empty — that thrash is not polish. Honor `prefers-reduced-motion` via `shouldAnimateReveal`.
- **Suspense** — lazy routes use a **neutral** `PageFallback` (header + rows, not media-grid-shaped) so chunk load is never a hard blank or shape flash.
- **Overlays** — reserve fuller spring/Y motion for drawers, drop targets, dialogs, toasts.
- **Shared primitives** — `ContentReveal`, `EmptyStateReveal`, `useAsyncReveal`, `Skeleton`, layout-matched skeletons (e.g. `MediaGridSkeleton`), and `FadeInImage` (opacity reveal, `loading="lazy"`, cached-image complete check).
- **Media empty splash** — `MediaEmptyVisual` + `MEDIA_EMPTY_STATE` is the gold-standard empty design; do not redesign it casually. Reuse the `EmptyState` shell pattern elsewhere.
- **Taxonomy IA** — Tags and Topics share one **Organize** surface (`/organize?tab=topics|tags`); legacy `/tags` and `/topics` redirect. One sidebar item when `canManageTaxonomy`.
- Do not clear list items the moment a filter request starts; replace when the response arrives.
- Prefer layout-owned width (`SidebarLayout` max-w-6xl); avoid re-wrapping every page in `mx-auto max-w-6xl px-4 py-8`. Use `mx-auto max-w-3xl` for integrations catalog rows; `max-w-2xl` only for truly narrow single-column forms.
- **Side drawers** — Media, taxonomy, user detail, and post inspector UIs share `SideDrawer` chrome; keep domain logic in feature drawers. User drawer is dual-mode: **self** = author profile fields; **other** = role dropdown + revoke (no Access/Role fieldset nesting, no admin-edited bios). Role/language pickers use Catalyst **Dropdown** menus with checkmarks — not native `<select>`. Language options come from the package catalog (labels + codes); timezone uses an IANA dropdown.
- **No author settings page** — `/settings` redirects home. Avatar menu opens the self profile drawer. Site integrations stay on `/settings/integrations`.
- **Danger text** — `text-red-600 dark:text-red-400` (not `red-500` in dark).
- **Reduced motion** — `ContentReveal` / `EmptyStateReveal` / Toaster / PillNav honor `prefers-reduced-motion`.
- **Post editor** — loading uses layout-matched skeleton (`data-post-editor-skeleton`); toolbar toggles use `aria-pressed`; link editing uses a dialog (never `window.prompt`). Quiet writing surface: **no bubble/floating selection menu** — formatting lives on the fixed toolbar only. Primary toolbar stays a **single row** (no wrap thrash): scrollable primary tools (`data-post-body-toolbar-scroll`) plus a **sticky end cluster** (`data-post-body-toolbar-end`) for **AI** / **More** / **Focus** so utilities stay visible on narrow widths. On `md+`, everyday marks/blocks/media stay as icons; secondary tools (strike, highlight, HR, table insert, alignment) live under a **More** menu (`data-post-body-toolbar-more`). Below `md`, collapse density: **Headings** and **Lists** Catalyst dropdowns; underline / quote / code move into More; do not invent a second toolbar row. **AI rewrite** (when Integrations AI is configured) lives in the sticky end cluster (`data-post-body-toolbar-ai`): selection-required improve/fix grammar/shorten/expand/custom; plain-text replace with **pending multi-line shimmer + settle fade** decorations (`box-decoration-break: clone`; not an instant hard cut; busy sparkles pulse; honor reduced motion); site-wide BYOK (Grok / ChatGPT / Claude), never client-side keys. **AI model** in Integrations is a Catalyst **Dropdown** of package presets (**Default** / **Fast** / **Expert** / **Custom**): Default stores null and tracks `AiProvider::defaultModel()`; Fast/Expert pin curated SKUs; Custom is free-text for any provider id. Integrations list rows stay plain (title + description + status badge) like Unsplash — no model meta line. **SEO AI** — when AI is configured, one **Suggest SEO** action (`suggest_seo`) fills title + meta description in a single request. Context is **title + summary** (body lede only if summary is empty), capped small for speed/reliability — never full-post ingest. Soft-fail with actionable toasts; never clear fields or block save/publish. AI is progressive enhancement; empty meta still falls back to post title/summary. **Code blocks** use `CodeBlockLowlight` with a dark panel token theme and a Catalyst language **Dropdown** (checkmarks), not a native `<select>`; default language is JavaScript (Auto remains available). Rich embeds (YouTube, X, Vimeo, …) are **paste-only** — no per-provider toolbar buttons. **Focus mode** lives on the body toolbar sticky end (`data-post-focus-toggle` / arrows-out icon), not the page nav; full-viewport writing surface (`data-post-editor-focus`); Esc exits. Editor nav uses one **icon-only** outline control (`data-post-inspector-trigger` / sidebar-right) for the **post inspector** drawer: internal **PillNav** sections **Post** (details, featured image, publish) and **SEO** (`PostSeoPanel`) as peer sections — SEO is not a buried subsection of publish details. Shell is `PostInspectorDrawer`; domain panels stay in `components/posts/*`. **Stats** is icon-only below `sm` (label from `sm` up). **Nav save status** is ephemeral: hidden when idle/pending, `Saving…` while in flight (minimum brief display), `Saved` for a few seconds after success with opacity fade; never clobber Saved via API `published_at` echo or concurrent clean saves. **Published vs pending** — drafts/scheduled posts autosave to the row; live posts autosave to `pending` JSON only so the public snapshot stays stable. Explicit **Update** (`promote: true`) writes live and clears pending; **Discard** restores the live snapshot. Public/host reads never use `pending`.
- **Focus rings** — prefer blue outline (`focus-visible:outline-2 outline-offset-2 outline-blue-500` / Catalyst `data-focus:outline-blue-500`).
- **Dashboard zero traffic** — when `totalActivity === 0`, keep stats cards and show EmptyState + write CTA (not empty charts thrash).
- **Organize filters** — search/sort via URL + API; true empty splash vs filtered-empty message (Media pattern).
- **Design tokens** — semantic `canvas-*` colors live in `resources/css/app.css` `@theme` (muted, danger, panel, border, focus). Prefer them for **app chrome**; Catalyst kit may stay zinc-first.
- **Typography helpers** — use `PageDescription` (page subtitles) and `ErrorText` (list/form errors) from `components/text.tsx` instead of one-off muted/danger class soups.
- **Design system of record** — AGENTS + shared components (no Storybook required for this package). Frontend Vitest covers pure `lib/` helpers and behavior, not `?raw` source string inventories.

## Development Commands

- `composer install`
- `composer lint` (PHPStan via Larastan)
- `composer test` (Pest)
- `composer test:parallel`
- `composer pint` or `vendor/bin/pint` (auto-fix formatting)
- `composer pint:test` (check formatting without fixing)
- `npm run typecheck` / `npm run lint` / `npm test` / `npm run build` (admin SPA)
