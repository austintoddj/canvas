<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\InteractsWithConsoleTasks;
use Illuminate\Console\Command;

class InstallCommand extends Command
{
    use InteractsWithConsoleTasks;

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
        $this->components->task('Publishing assets', fn (): int => $this->runSilentTask(
            'vendor:publish',
            ['--tag' => 'canvas-assets'],
        ));

        $this->components->task('Publishing configuration', fn (): int => $this->runSilentTask(
            'vendor:publish',
            ['--tag' => 'canvas-config'],
        ));

        $this->components->task('Running migrations', fn (): int => $this->runSilentTask('canvas:migrate'));

        $this->components->task('Linking storage', fn (): int => $this->runSilentTask('storage:link'));

        $this->newLine();
        $this->info('Canvas installed successfully.');
        $this->comment('Grant yourself admin access: php artisan canvas:make-admin you@email.com');
        $this->comment('Visit: /canvas');

        return self::SUCCESS;
    }
}
