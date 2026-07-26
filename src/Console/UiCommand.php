<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\InteractsWithConsoleTasks;
use Illuminate\Console\Command;
use Illuminate\Console\View\TaskResult;

class UiCommand extends Command
{
    use InteractsWithConsoleTasks;

    protected $signature = 'canvas:ui { --force : Overwrite existing views and controller }';

    protected $description = 'Publish the Canvas reader UI views, controller, and route stub';

    /** @var list<string> */
    private array $skipped = [];

    public function handle(): int
    {
        $this->components->task('Publishing views', function (): int {
            return $this->runSilentTask('vendor:publish', [
                '--tag' => 'canvas-ui-views',
                '--force' => $this->option('force'),
            ]);
        });

        $this->components->task(
            'Publishing controller',
            fn (): int => $this->publishController(),
        );

        $this->components->task(
            'Publishing routes',
            fn (): int => $this->publishRoutes(),
        );

        $this->components->task(
            'Registering routes',
            fn (): int => $this->registerRoutesInWeb(),
        );

        foreach ($this->skipped as $path) {
            $this->components->warn("{$path} already exists. Use --force to overwrite.");
        }

        $this->newLine();
        $this->info('Canvas UI published successfully.');
        $this->comment('Visit: /canvas-ui');

        return self::SUCCESS;
    }

    private function publishController(): int
    {
        $target = app_path('Http/Controllers/Canvas/CanvasUiController.php');

        if (file_exists($target) && ! $this->option('force')) {
            $this->skipped[] = 'app/Http/Controllers/Canvas/CanvasUiController.php';

            return TaskResult::Skipped->value;
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

        return TaskResult::Success->value;
    }

    private function publishRoutes(): int
    {
        $target = base_path('routes/canvas-ui.php');

        if (file_exists($target) && ! $this->option('force')) {
            $this->skipped[] = 'routes/canvas-ui.php';

            return TaskResult::Skipped->value;
        }

        copy(dirname(__DIR__, 2).'/resources/stubs/routes/canvas-ui.stub', $target);

        return TaskResult::Success->value;
    }

    private function registerRoutesInWeb(): int
    {
        $webPath = base_path('routes/web.php');

        if (! is_file($webPath)) {
            $this->components->warn('routes/web.php not found. Add require __DIR__.\'/canvas-ui.php\'; manually.');

            return TaskResult::Skipped->value;
        }

        $contents = file_get_contents($webPath);

        if ($contents === false) {
            $this->components->warn('Unable to read routes/web.php. Add require __DIR__.\'/canvas-ui.php\'; manually.');

            return TaskResult::Skipped->value;
        }

        if (str_contains($contents, 'canvas-ui.php')) {
            return TaskResult::Skipped->value;
        }

        $require = "require __DIR__.'/canvas-ui.php';";
        $trimmed = rtrim($contents);

        $updated = $trimmed === ''
            ? "<?php\n\n{$require}\n"
            : $trimmed."\n\n{$require}\n";

        if (file_put_contents($webPath, $updated) === false) {
            $this->components->warn('Unable to update routes/web.php. Add require __DIR__.\'/canvas-ui.php\'; manually.');

            return TaskResult::Skipped->value;
        }

        return TaskResult::Success->value;
    }
}
