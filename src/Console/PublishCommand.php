<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\InteractsWithConsoleTasks;
use Illuminate\Console\Command;

class PublishCommand extends Command
{
    use InteractsWithConsoleTasks;

    protected $signature = 'canvas:publish { --force : Overwrite any existing files }';

    protected $description = 'Publish the available assets';

    public function handle(): int
    {
        $this->components->task('Publishing configuration', function (): int {
            return $this->runSilentTask('vendor:publish', [
                '--tag' => 'canvas-config',
                '--force' => $this->option('force'),
            ]);
        });

        $this->components->task('Publishing assets', function (): int {
            return $this->runSilentTask('vendor:publish', [
                '--tag' => 'canvas-assets',
                '--force' => true,
            ]);
        });

        $this->newLine();
        $this->info('Publishing complete.');

        return self::SUCCESS;
    }
}
