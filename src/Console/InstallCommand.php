<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Console\View\TaskResult;

class InstallCommand extends Command
{
    protected $signature = 'canvas:install';

    protected $description = 'Install the Canvas components and resources';

    public function __construct()
    {
        parent::__construct();

        if (file_exists(config_path('canvas.php'))) {
            $this->setHidden(true);
        }
    }

    public function handle(): int
    {
        $this->components->info('Installing Canvas.');

        $this->components->task('Publishing assets', fn (): int => $this->runSilentTask(
            'vendor:publish',
            ['--tag' => 'canvas-assets'],
        ));

        $this->components->task('Publishing configuration', fn (): int => $this->runSilentTask(
            'vendor:publish',
            ['--tag' => 'canvas-config'],
        ));

        $this->components->task('Running migrations', fn (): int => $this->runSilentTask('canvas:migrate'));

        $this->newLine();
        $this->components->info('Installation complete.');
        $this->components->bulletList([
            'Create or sign in to a user account in your application',
            'php artisan canvas:make-admin your@email.com',
            'php artisan storage:link (if you have not already)',
            'Set APP_URL in .env to the URL you open in the browser (e.g. http://blog.test)',
        ]);

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function runSilentTask(string $command, array $parameters = []): int
    {
        return $this->callSilent($command, $parameters) === self::SUCCESS
            ? TaskResult::Success->value
            : TaskResult::Failure->value;
    }
}
