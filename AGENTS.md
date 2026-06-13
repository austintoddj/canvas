# AGENTS.md

## Project Context
Canvas is a Laravel package that adds a full blog/publishing system to an existing Laravel application. We are currently in a major modernization effort (target: modern Laravel 11/12/13 standards, PHP 8.2+, strict types, clean architecture, and removal of legacy patterns).

## Core Rules (Always Follow)

### Avoid Redundancy
- Before implementing any new feature, class, method, or UI component, **search the codebase** for similar existing functionality.
- If something similar exists, extend or refactor it instead of duplicating.
- Explicitly state in your reasoning: "Checked for existing X in src/..., found Y, decided to Z because..."

### Laravel Modernization Standards
- Target modern Laravel practices (use attributes over service providers where possible, readonly classes/properties, typed properties, enums, match expressions, etc.).
- Prefer Laravel's built-in features over custom implementations.
- Use `laravel/pint` for formatting. Run it on changed files.
- Follow PSR-12 + Laravel Pint rules strictly.
- Prefer dependency injection and service classes over fat controllers or static facades where it improves testability/clarity.
- Update tests alongside code changes.

### Testing Standards
- Use Pest for tests. Prefer function-style tests, `dataset()`s, and shared setup in `tests/Pest.php`.
- Keep `tests/TestCase.php` focused on Testbench/package environment setup only.
- Run the relevant Pest file first while iterating, then run the full parallel suite before finishing.

### Package-Specific Guidelines
- Respect the existing structure (`src/`, `config/`, `resources/`, etc.) unless we're intentionally refactoring it.
- Maintain backward compatibility where reasonable during the modernization.
- Keep the "distraction-free writing" philosophy intact.
- Prefer class-based factories and `Model::factory()` over legacy `factory()` helpers.
- Keep package-specific request base classes in `src/Http/Requests/` when they are needed to avoid framework coupling.
- Prefer the smallest practical set of `illuminate/*` packages; do not reintroduce `laravel/framework` without a strong reason.

## Development Commands
- `composer install`
- `composer test` (Pest)
- `composer test:parallel`
- `composer pint` or `vendor/bin/pint`

## When Making Changes
1. Read relevant files first.
2. Check for redundancy.
3. Make the smallest effective change.
4. Update tests if behavior changes.
5. Run Pint.
6. Run the relevant Pest tests, then the full parallel suite if the change touches behavior.
7. Explain what you did and why.
