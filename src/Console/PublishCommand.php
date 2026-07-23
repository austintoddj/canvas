<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Console\View\TaskResult;

class PublishCommand extends Command
{
    protected $signature = 'canvas:publish { --force : Overwrite any existing files }';

    protected $description = 'Publish the available assets';

    public function handle(): int
    {
        $this->components->task('Publishing configuration', function (): int {
            return $this->taskResult($this->callSilent('vendor:publish', [
                '--tag' => 'canvas-config',
                '--force' => $this->option('force'),
            ]));
        });

        $this->components->task('Publishing assets', function (): int {
            return $this->taskResult($this->callSilent('vendor:publish', [
                '--tag' => 'canvas-assets',
                '--force' => true,
            ]));
        });

        $this->components->info('Publishing complete.');

        return self::SUCCESS;
    }

    private function taskResult(int $exitCode): int
    {
        return $exitCode === self::SUCCESS
            ? TaskResult::Success->value
            : TaskResult::Failure->value;
    }
}
