<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;

class UiCommand extends Command
{
    protected $signature = 'canvas:ui { --force : Overwrite existing views and controller }';

    protected $description = 'Publish the Canvas reader UI views, controller, and route stub';

    public function handle(): void
    {
        $this->call('vendor:publish', [
            '--tag' => 'canvas-ui-views',
            '--force' => $this->option('force'),
        ]);

        $this->publishController();
        $this->publishRoutes();

        $this->info('Canvas reader UI installed successfully.');
        $this->newLine();
        $this->comment('Views:      resources/views/vendor/canvas/ui/');
        $this->comment('Controller: app/Http/Controllers/Canvas/CanvasUiController.php');
        $this->comment('Routes:     routes/canvas-ui.php');
        $this->newLine();
        $this->line('Add the following to your routes/web.php to activate the reader UI:');
        $this->line("  require __DIR__.'/canvas-ui.php';");
        $this->newLine();
        $this->line('HasCanvasAccess on your User model is optional — the sample reader does not require it.');
        $this->line('Post show routes use Canvas\\Http\\Middleware\\Session to prune analytics session keys.');
    }

    private function publishController(): void
    {
        $target = app_path('Http/Controllers/Canvas/CanvasUiController.php');

        if (file_exists($target) && ! $this->option('force')) {
            $this->warn('app/Http/Controllers/Canvas/CanvasUiController.php already exists. Use --force to overwrite.');

            return;
        }

        if (! is_dir(dirname($target))) {
            mkdir(dirname($target), 0755, true);
        }

        copy(
            dirname(__DIR__, 2).'/resources/stubs/controllers/CanvasUiController.stub',
            $target
        );

        $contents = file_get_contents($target);
        file_put_contents($target, str_replace('{{namespace}}', app()->getNamespace(), $contents));

        $this->info('Published CanvasUiController.');
    }

    private function publishRoutes(): void
    {
        $target = base_path('routes/canvas-ui.php');

        if (file_exists($target) && ! $this->option('force')) {
            $this->warn('routes/canvas-ui.php already exists. Use --force to overwrite.');

            return;
        }

        copy(dirname(__DIR__, 2).'/resources/stubs/routes/canvas-ui.stub', $target);

        $this->info('Published routes/canvas-ui.php.');
    }
}
