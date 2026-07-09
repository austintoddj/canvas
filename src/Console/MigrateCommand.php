<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;

class MigrateCommand extends Command
{
    protected $signature = 'canvas:migrate { --force : Force the operation to run when in production }';

    protected $description = 'Run Canvas schema migrations only (does not reshape v6 data)';

    public function handle(): int
    {
        $this->callSilent('migrate', [
            '--path' => 'vendor/austintoddj/canvas/database/migrations',
            '--force' => (bool) $this->option('force'),
        ]);

        $this->info('Canvas schema migration complete.');
        $this->line('This command only runs package migrations. It does not convert v6 data.');
        $this->line('Upgrading from v6? See UPGRADE.md scenarios, then run: php artisan canvas:upgrade-report');

        return self::SUCCESS;
    }
}
