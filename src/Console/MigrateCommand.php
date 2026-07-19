<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;

class MigrateCommand extends Command
{
    protected $signature = 'canvas:migrate { --force : Force the operation to run when in production }';

    protected $description = 'Run the Canvas package migrations';

    public function handle(): int
    {
        $this->callSilent('migrate', [
            '--path' => 'vendor/austintoddj/canvas/database/migrations',
            '--force' => (bool) $this->option('force'),
        ]);

        $this->info('Canvas migrations complete.');

        return self::SUCCESS;
    }
}
