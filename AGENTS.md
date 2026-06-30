# AGENTS.md

## Project Context

Canvas is a Laravel package that adds a full blog/publishing system to an existing Laravel application.

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

### Testing Standards

- Use Pest for tests. Prefer function-style tests, `dataset()`s, and shared setup in `tests/Pest.php`.
- Keep `tests/TestCase.php` focused on Testbench/package environment setup only.
- Architecture tests live in `tests/ArchitectureTest.php` — update them when structural rules change.
- Run the relevant Pest file first while iterating, then run the full parallel suite before finishing.

### Documentation Files

- You must only create documentation files if explicitly requested by the user.

### Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

### Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

### Package-Specific Guidelines

- Respect the existing structure (`src/`, `config/`, `resources/`, etc.) unless we're intentionally refactoring it.
- Maintain backward compatibility where reasonable during the modernization.
- Keep the "distraction-free writing" philosophy intact.
- Prefer class-based factories and `Model::factory()` over legacy `factory()` helpers.
- Keep package-specific request base classes in `src/Http/Requests/` when they are needed to avoid framework coupling.
- Prefer the smallest practical set of `illuminate/*` packages.

## Development Commands

- `composer install`
- `composer lint` (PHPStan via Larastan)
- `composer test` (Pest)
- `composer test:parallel`
- `composer pint` or `vendor/bin/pint` (auto-fix formatting)
- `composer pint:test` (check formatting without fixing)
