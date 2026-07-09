# v6 → v7 upgrade SQL packs

These scripts are **optional helpers** for operators upgrading from Canvas 6.x. They do **not** replace reading [UPGRADE.md](../../.github/UPGRADE.md).

`php artisan canvas:migrate` only runs package schema migrations. It **never** reshapes existing v6 rows.

`php artisan canvas:upgrade-report` prints read-only detection and orphan counts against your current database.

| Pack      | Purpose         |
| --------- | --------------- |
| `mysql/`  | MySQL / MariaDB |
| `pgsql/`  | PostgreSQL      |
| `sqlite/` | SQLite          |

Common flow:

1. Back up the database.
2. `php artisan canvas:upgrade-report`
3. Follow UPGRADE.md Scenario A or B (create host users + map IDs).
4. Use the packs for topics pivot and orphan checks as needed.
5. Re-run `canvas:upgrade-report` and the [smoke checklist](../../.github/UPGRADE.md#post-upgrade-smoke).
