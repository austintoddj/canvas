<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\InteractsWithConsoleTasks;
use Illuminate\Console\Command;

class MigrateCommand extends Command
{
    use InteractsWithConsoleTasks;

    protected $signature = 'canvas:migrate { --force : Force the operation to run when in production }';

    protected $description = 'Run the Canvas package migrations';

    public function handle(): int
    {
        $this->components->task('Running Canvas migrations', function (): int {
            return $this->runSilentTask('migrate', [
                '--path' => 'vendor/austintoddj/canvas/database/migrations',
                '--force' => (bool) $this->option('force'),
            ]);
        });

        $this->newLine();
        $this->info('Canvas migrations complete.');

        return self::SUCCESS;
    }
}
