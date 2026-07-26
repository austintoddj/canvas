<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Enums\Role;
use Illuminate\Console\Command;

class RolesCommand extends Command
{
    protected $signature = 'canvas:roles';

    protected $description = 'List Canvas roles that can be assigned via the CLI';

    public function handle(): int
    {
        $rows = collect(Role::cases())
            ->map(static fn (Role $role): array => [
                $role->name,
                (string) $role->value,
                $role->label(),
            ])
            ->all();

        $this->table(['Name', 'Value', 'Label'], $rows);

        $this->newLine();
        $this->line('  <fg=gray>Assign:</> php artisan canvas:assign-role user@example.com Editor');
        $this->line('  <fg=gray>Admin shortcut:</> php artisan canvas:make-admin user@example.com');

        return self::SUCCESS;
    }
}
