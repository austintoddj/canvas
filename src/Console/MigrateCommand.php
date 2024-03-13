<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;

class MigrateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:migrate { --force : Force the operation to run when in production }';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run Canvas migrations';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $this->callSilent('migrate', [
            '--database' => config('canvas.database_connection'),
            '--path' => 'vendor/austintoddj/canvas/database/migrations',
            '--force' => $this->option('force') ?? true,
        ]);

        $this->info('Migration complete.');
    }
}
