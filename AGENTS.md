# AGENTS.md

## Project Context

Canvas is a Laravel package that adds a full blog/publishing system to an existing Laravel application.

## Living standards (how this file relates to plans)

This file is the **durable coding standard** for Canvas. Implementation plans are tactical and must not drift from it.

| Document | Role |
| -------- | ---- |
| **`Agents.md` (this file)** | Always-on rules for how we write, test, and ship code |
| [`.github/UPGRADE.md`](.github/UPGRADE.md) | Host contract, v6→v7 upgrade, support notes for installers |
| [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) | Contributor setup, support window, FormRequest major checklist |
| [`.github/docs/spa-plan.md`](.github/docs/spa-plan.md) | Admin SPA tracker (frontend) |

**Rules for agents and humans working plans:**

1. **Every** tracker item is implemented under these standards — not just “what the tracker says,” but *how* it is written.
2. When product/architecture decisions land, implement them in code **and** keep this file (or UPGRADE) updated if the decision is durable.
3. Prefer this file for permanent style/quality philosophy; UPGRADE for host integration; SPA plan for ordered frontend work.
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
- Keep package-specific request base classes in `src/Http/Requests/` when they are needed to avoid framework coupling.
- Prefer the smallest practical set of `illuminate/*` packages.
- Respect the existing structure (`src/`, `config/`, `resources/`, etc.) unless intentionally refactoring.
- Maintain backward compatibility where reasonable; keep the distraction-free writing philosophy intact.

## Development Commands

- `composer install`
- `composer lint` (PHPStan via Larastan)
- `composer test` (Pest)
- `composer test:parallel`
- `composer pint` or `vendor/bin/pint` (auto-fix formatting)
- `composer pint:test` (check formatting without fixing)
- `npm run typecheck` / `npm run lint` / `npm test` / `npm run build` (admin SPA)
