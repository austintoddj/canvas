<?php

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Console\DetectsApplicationNamespace;

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
    protected $description = 'Generate a default controller with blog views and routes';

    /**
     * The views that need to be exported.
     *
     * @var array
     */
    protected $views = [
        'layouts/app.stub'     => 'layouts/app.blade.php',
        'partials/navbar.stub' => 'partials/navbar.blade.php',
        'partials/styles.stub' => 'partials/styles.blade.php',
        'index.stub'           => 'index.blade.php',
        'show.stub'            => 'show.blade.php',
    ];

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $this->comment('Creating the view directories...');
        $this->createDirectories();

        $this->comment('Building the views...');
        $this->exportViews();

        $this->comment('Compiling the controller...');
        file_put_contents(
            app_path('Http/Controllers/BlogController.php'),
            $this->compileControllerStub()
        );

        $this->comment('Writing the routes...');
        file_put_contents(
            base_path('routes/web.php'),
            file_get_contents(dirname(__DIR__, 2).'/stubs/routes.stub'),
            FILE_APPEND
        );

        $this->line('');
        $this->line('<info>[✔]</info> Canvas is setup and ready to use. Enjoy! Head over to '.route('blog.index').' to get started.');
    }

    /**
     * Create the directories for the views.
     *
     * @return void
     */
    protected function createDirectories()
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
    protected function exportViews()
    {
        foreach ($this->views as $key => $value) {
            if (file_exists($view = resource_path('views/blog/'.$value))) {
                if (! $this->confirm("The [{$value}] view already exists. Do you want to replace it?")) {
                    continue;
                }
            }

            copy(
                sprintf('%s/stubs/views/blog/%s', dirname(__DIR__, 2), $key),
                $view
            );
        }
    }

    /**
     * Compiles the HomeController stub.
     *
     * @return string
     */
    protected function compileControllerStub()
    {
        return str_replace(
            '{{namespace}}',
            $this->getAppNamespace(),
            file_get_contents(dirname(__DIR__, 2).'/stubs/controllers/BlogController.stub')
        );
    }
}
