<?php

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Console\DetectsApplicationNamespace;
use Illuminate\Support\Facades\Route;

class SetupCommand extends Command
{
    use DetectsApplicationNamespace;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scaffold the frontend controller, views, and routes';

    /**
     * The views that need to be exported.
     *
     * @var array
     */
    protected $views = [
        'layouts/app.stub' => 'layouts/app.blade.php',
        'partials/navbar.stub' => 'partials/navbar.blade.php',
        'partials/styles.stub' => 'partials/styles.blade.php',
        'index.stub' => 'index.blade.php',
        'show.stub' => 'show.blade.php',
    ];

    /**
     * Execute the console command.
     *
     * @return void
     * @throws \Exception
     */
    public function handle()
    {
        $this->createDirectories();
        $this->exportViews();
        $this->buildController();
        $this->registerRoutes();

        $this->info('Setup complete. Head over to <comment>'.url('/blog').'</comment> to get started.');
    }

    /**
     * Create the view directories.
     *
     * @return void
     */
    private function createDirectories()
    {
        if (! is_dir($directory = resource_path('views/blog/layouts'))) {
            mkdir($directory, 0755, true);
        }

        if (! is_dir($directory = resource_path('views/blog/partials'))) {
            mkdir($directory, 0755, true);
        }
    }

    /**
     * Export the default blog views.
     *
     * @return void
     */
    private function exportViews()
    {
        foreach ($this->views as $key => $value) {
            if (file_exists($view = resource_path('views/blog/'.$value))) {
                if (! $this->confirm("The [blog/{$value}] view already exists. Do you want to replace it?")) {
                    continue;
                }
            }

            copy(
                sprintf('%s/resources/stubs/views/blog/%s', dirname(__DIR__, 2), $key),
                $view
            );
        }
    }

    /**
     * Build the new controller.
     *
     * @return void
     */
    private function buildController()
    {
        if (! file_exists($controller = app_path('Http/Controllers/BlogController.php'))) {
            $this->exportController();
        } else {
            if ($this->confirm('The [Http/Controllers/BlogController.php] already exists. Do you want to replace it?')) {
                $this->exportController();
            }
        }
    }

    /**
     * Export the new controller.
     *
     * @return void
     */
    private function exportController()
    {
        file_put_contents(
            app_path('Http/Controllers/BlogController.php'),
            $this->compileControllerStub()
        );
    }

    /**
     * Compile the default controller stub.
     *
     * @return string
     */
    private function compileControllerStub()
    {
        return str_replace(
            '{{namespace}}',
            $this->getAppNamespace(),
            file_get_contents(dirname(__DIR__, 2).'/resources/stubs/controllers/BlogController.stub')
        );
    }

    /**
     * Register the new routes.
     *
     * @return void
     */
    private function registerRoutes()
    {
        if (! Route::has('blog.index')) {
            file_put_contents(
                base_path('routes/web.php'),
                file_get_contents(dirname(__DIR__, 2).'/resources/stubs/routes.stub'),
                FILE_APPEND
            );
        }
    }
}
