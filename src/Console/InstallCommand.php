<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;

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

    public function handle(): void
    {
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-provider']);
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-assets']);
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-config']);
        $this->callSilent('canvas:migrate');

        $this->info('Installation complete.');
        $this->info('Next, create or sign in to a user account in your application, then run:');
        $this->line('  php artisan canvas:make-admin your@email.com');
    }
}
