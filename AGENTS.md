# AGENTS.md — Canvas

Laravel publishing **package** (`austintoddj/canvas`): PHP API + React admin SPA. Not a full app. Hosts install via Composer; admin assets publish to `public/vendor/canvas`.

**Docs authority:** `readme.md` = product blurb + minimal install flyer · **`docs/`** = living host manual (install, config, auth, Canvas UI, content, webhooks) · `.github/UPGRADE.md` = version-to-version breaking changes only · `.github/CONTRIBUTING.md` = contributor/PR workflow · `AGENTS.md` = agent operating rules. Do not triplicate — host how-tos go in `docs/`, not re-pasted into readme, UPGRADE, stubs, or this file.

## Working rules

- **Prefer latest PHP/Laravel:** target the newest language and framework features within this package’s supported matrix (`composer.json` / CI). Use modern APIs for new code; don’t write down-level patterns “for older hosts” unless a supported major actually requires it.
- **Laravel Boost skills:** https://github.com/laravel/boost/tree/main/.ai/laravel — use root `core.blade.php` (cross-version) **plus** the highest versioned dir present (`12/` today; `13/` when Boost ships it; never prefer `11/` for new work) **and** `skill/laravel-best-practices`. **This file wins** when Boost’s app-centric advice conflicts with package seams (Illuminate components, local FormRequest, no host scaffold).
- **Scope:** minimal diffs only. Do not refactor adjacent code, “clean up” comments, or expand scope beyond the ask.
- **Secrets:** never commit `.env`, webhook secrets, AI keys, or host credentials; never log them in tests/fixtures.
- **Runtime:** Pest runs in-package via Orchestra Testbench — no sibling Laravel app required. E2E and install-smoke need a host (`bin/e2e-prepare.sh`, `bin/install-smoke.sh`). Do not invent a full app scaffold for unit work.
- **Patterns:** copy neighboring controllers/pages/tests. Do not introduce new layers (repositories, global stores, foundation deps) without local precedent.
- **Tests:** while iterating, filter Pest/Vitest to the touched area; run `composer test -- --filter=LocalizationTest` when changing `resources/lang` or UI copy; full PR gate below before calling work done.
- **Git:** do not perform any Git actions unless the user explicitly grants permission.

## Layout

| Path | Role |
|------|------|
| `src/` | Package PHP (`Canvas\`), PSR-4 |
| `routes/web.php` | Package routes (auth + API + SPA shell) |
| `config/canvas.php` | Published config |
| `database/migrations/`, `database/factories/` | Package schema + factories |
| `docs/` | Host-facing documentation (versioned with the package) |
| `resources/js/` | Admin SPA (React 19, TipTap, RR v7, Tailwind 4, Headless UI) |
| `resources/js/__tests__/` | Vitest unit/component tests |
| `resources/lang/{locale}/app.php` | UI catalog (17 locales; `en` is source of truth) |
| `resources/dist/` | **Committed** Vite build — hosts serve this |
| `resources/views/`, `resources/stubs/` | Blade layout/mail + `canvas:ui` stubs (code only; no host manuals) |
| `tests/` | Pest (PHP); `tests/e2e/` Playwright |
| `bin/` | `preflight.sh`, `install-smoke.sh`, `e2e-prepare.sh` |

Path alias: `@/*` → `resources/js/*` (`tsconfig.json`, `vite.config.ts`).

## Tooling

- **PHP** ≥ 8.3 (prefer newest CI matrix PHP), **Laravel** 12|13 (prefer newest major APIs; Illuminate components only — not full `laravel/framework` as a require)
- **Node** 22 (CI), **npm** + `package-lock.json` (`.npmrc`: `legacy-peer-deps=true`)
- Pest + Arch, Orchestra Testbench, Larastan **level 6**, Laravel Pint
- Vitest (happy-dom/jsdom via setup), Playwright e2e, ESLint 10 flat config, Prettier

## Commands (repo root)

### Install

```bash
composer install
npm ci
```

### Build / dev (SPA)

```bash
npm run dev              # Vite; writes resources/dist/canvas.hot
npm run build            # production → resources/dist/ (commit this)
npm run preview
```

### Lint / format / types

```bash
composer pint            # fix PHP (vendor/bin/pint)
composer pint:test       # check only
composer lint            # vendor/bin/phpstan analyse (phpstan.neon.dist)
npm run lint             # eslint . (resources/js/**/*.{ts,tsx})
npm run format           # prettier --write .
npm run typecheck        # tsc --noEmit (typescript-7)
```

### Tests

```bash
composer test            # vendor/bin/pest
composer test:ci         # parallel + junit → build/junit.xml
composer test:parallel
composer test:coverage   # --min=98 (pcov)
composer test:coverage:html  # build/coverage/
composer test:database   # --group=database (set DB_CONNECTION=mysql|pgsql)
composer test:install-smoke  # bash bin/install-smoke.sh
composer test -- --filter=LocalizationTest

npm test                 # vitest run (resources/js/__tests__)
npm run test:coverage    # coverage/ 
npm run test:watch
npm run e2e:prepare      # bash bin/e2e-prepare.sh
npm run e2e              # playwright (tests/e2e/)
npm run e2e:ui
```

### Preflight (deps + lint + build + pint)

```bash
bash bin/preflight.sh    # or: npm run preflight | composer preflight
```

Config touchpoints: `phpunit.xml.dist`, `phpstan.neon.dist`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc`, `vite.config.ts`, `testbench.yaml`.

## PR quality gate (match CI)

1. `npm run typecheck && npm run lint && npm test`
2. `npm run build` — **commit** `resources/dist/` if SPA changed
3. `composer pint:test && composer lint && composer test:ci`
4. UI strings: full lang catalog + `composer test -- --filter=LocalizationTest`

## Do

- **Package seams:** depend on `illuminate/*` contracts; keep host optional. Optional gift: `src/Concerns/HasCanvasAccess.php`.
- **Form requests:** extend `Canvas\Http\Requests\FormRequest` (not `Illuminate\Foundation\Http\FormRequest`).
- **`declare(strict_types=1);`** on PHP; actions invokable; policies/controllers/commands use conventional suffixes (see `tests/ArchitectureTest.php`).
- **Native types first.** PHPDoc only for shapes/generics Larastan cannot infer (`list<>`, `array{…}`, `@use HasFactory`, relation generics) or non-obvious contracts.
- **SPA:** React function components; state via `CanvasContext` + hooks (`resources/js/contexts/`, `hooks/`); API via `resources/js/lib/api*`; classes via `cn()` (`clsx` + `tailwind-merge`); UI strings via `t()` / `trans('canvas::app.…')`.
- **i18n:** change `resources/lang/en/app.php` first, then **every** locale with real translations and identical keys. Wire keys before inventing duplicates.
- **Host docs:** if a change alters a **host-visible contract** (config keys/env, artisan CLI for hosts, routes/middleware hosts rely on, Eloquent public scopes, post body HTML/embeds, webhooks/events, `canvas:ui` stubs/views, access/roles), update the matching file(s) under `docs/` **in the same PR**. Prefer editing `docs/` over expanding `readme.md` or stuffing living guide text into `UPGRADE.md`. Do not add host pages for the admin SPA JSON API or a troubleshooting dump unless hosts truly need them — consumers care about install, config, auth, UI, content, and webhooks. Pure SPA polish or internal refactors need no docs noise. Source and tests are authoritative when something drifts — fix the doc in that same change.
- **Docs voice:** match official Laravel documentation — short introductions, scannable H2s, code-first examples, dense tables where useful, plain second person (“you may…”). Prefer less prose over exhaustive coverage. No agent/process meta in host docs (no “fix this file in the same PR”, ownership maps, or review checklists). Those rules live only here and in CONTRIBUTING.
- **Tests:** Pest feature/unit under `tests/`; Vitest colocated under `resources/js/__tests__/`. Mark bugfixes `// Regression: GH-N`; long-lived behavior `// Invariant: …` (`tests/Pest.php`).
- **Comments:** only non-obvious **why** or tooling contracts. Prefer delete over filler.

## Don't

- Add `illuminate/foundation` as a package require; don't import foundation FormRequest in `src/`.
- Eager-load host `canvasUser` relations from core package code (`tests/Architecture/HostSeamsTest.php`).
- Use `dd` / `dump` / `die` / `var_dump` in package code.
- Introduce Redux/Zustand/other global stores — stay on context + local state.
- Use yarn/pnpm; leave uncommitted SPA dist after UI changes; land `en`-only lang keys or English placeholders in other locales.
- Scaffold/AI filler comments, section banners (`// Stats routes…`), CSS style-array labels (`// Hover`), or PHPDoc that only mirrors native types.
- Claim coverage without a fresh `composer test:coverage` run (floor **98%**).
- Land host-contract changes without updating `docs/` when behavior hosts depend on changed.
- Expand root `readme.md` into a second manual; put host manuals under `resources/stubs/` or recreate prose dumps under `.github/docs/`.
- Write host docs in dense “spec dump” or AI-maintainer voice; do not put agent operating notes inside `docs/`.

## Domain notes

- Roles: Contributor / Editor / Admin (`Canvas\Enums\Role`). Integrations: Unsplash, AI writing, webhooks, weekly digest.
- Publish wire: ISO-8601 with offset/Z for `published_at` HTTP payloads (see `publishedAtIso()` in `tests/Pest.php`).
- Default PR target: `develop` (see `.github/CONTRIBUTING.md` for host path-repo workflow).
