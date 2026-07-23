<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Console\View\TaskResult;

class MigrateCommand extends Command
{
    protected $signature = 'canvas:migrate { --force : Force the operation to run when in production }';

    protected $description = 'Run the Canvas package migrations';

    public function handle(): int
    {
        $this->components->task('Running Canvas migrations', function (): int {
            $exitCode = $this->callSilent('migrate', [
                '--path' => 'vendor/austintoddj/canvas/database/migrations',
                '--force' => (bool) $this->option('force'),
            ]);

            return $exitCode === self::SUCCESS
                ? TaskResult::Success->value
                : TaskResult::Failure->value;
        });

        $this->components->info('Canvas migrations complete.');

        return self::SUCCESS;
    }
}
