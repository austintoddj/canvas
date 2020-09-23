<?php

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

class UiCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:ui { --force : Overwrite existing views by default }';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install a frontend Canvas UI';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $this->ensureDirectoriesExist();
        $this->exportViews();
        $this->exportBackend();
        $this->updatePackages();
        $this->exportSass();
        $this->exportJavascript();
        $this->updateWebpackConfiguration();
        $this->removeNodeModules();

        $this->info('Installation complete.');
        $this->comment('Please run "npm install && npm run dev" to compile your fresh scaffolding.');
    }

    /**
     * Create the directories for the files.
     *
     * @return void
     */
    private function ensureDirectoriesExist()
    {
        $filesystem = new Filesystem;

        $directories = [
            $this->getViewPath('canvas-ui'),
            resource_path('sass'),
            resource_path('js/canvas-ui'),
            resource_path('sass/canvas-ui'),
        ];

        foreach ($directories as $path) {
            if (! $filesystem->isDirectory($directory = resource_path($path))) {
                $filesystem->makeDirectory($directory, 0755, true);
            }
        }
    }

    /**
     * Update the "package.json" file.
     *
     * @param bool $dev
     * @return void
     */
    private function updatePackages($dev = true)
    {
        if (! file_exists(base_path('package.json'))) {
            return;
        }

        $configurationKey = $dev ? 'devDependencies' : 'dependencies';

        $packages = json_decode(file_get_contents(base_path('package.json')), true);

        $packages[$configurationKey] = $this->updatePackageArray(
            array_key_exists($configurationKey, $packages) ? $packages[$configurationKey] : [],
            $configurationKey
        );

        ksort($packages[$configurationKey]);

        file_put_contents(
            base_path('package.json'),
            json_encode($packages, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT).PHP_EOL
        );
    }

    /**
     * Update the given package array.
     *
     * @param array $packages
     * @return array
     */
    private function updatePackageArray(array $packages)
    {
        return [
            'bootstrap' => '^4.5.2',
            'jquery' => '^3.5.1',
            'medium-zoom' => '^1.0.6',
            'moment' => '^2.29.0',
            'nprogress' => '^0.2.0',
            'popper.js' => '^1.16.1',
            'resolve-url-loader' => '^3.1.1',
            'sass' => '^1.26.11',
            'sass-loader' => '^10.0.0',
            'vue' => '^2.6.11',
            'vue-meta' => '^2.4.0',
            'vue-router' => '^3.4.2',
            'vue-template-compiler' => '^2.6.11',
        ] + $packages;
    }

    /**
     * Export the Sass file for the application.
     *
     * @return void
     */
    private function exportSass()
    {
        copy(__DIR__.'/../resources/stubs/sass/canvas-ui.stub', resource_path('sass/canvas-ui.scss'));
    }

    /**
     * Export the single page application.
     *
     * @return void
     */
    private function exportJavascript()
    {
        //
    }

    /**
     * Export the authentication views.
     *
     * @return void
     */
    private function exportViews()
    {
        if (file_exists($view = $this->getViewPath('canvas-ui.blade.php')) && ! $this->option('force')) {
            if (! $this->confirm('The [canvas-ui.blade.php] view already exists. Do you want to replace it?')) {
                return;
            }
        }

        copy(dirname(__DIR__, 2).'/resources/stubs/views/canvas-ui.stub', $view);
    }

    /**
     * Export the backend controllers and routes.
     *
     * @return void
     */
    private function exportBackend()
    {
        file_put_contents(
            app_path('Http/Controllers/CanvasUiController.php'),
            str_replace(
                '{{namespace}}',
                $this->laravel->getNamespace(),
                file_get_contents(__DIR__.'/../../resources/stubs/controllers/CanvasUiController.stub')
            )
        );

        file_put_contents(
            base_path('routes/web.php'),
            file_get_contents(__DIR__.'/../../resources/stubs/routes.stub'),
            FILE_APPEND
        );
    }

    /**
     * Get full view path relative to the application's configured view path.
     *
     * @param string $path
     * @return string
     */
    private function getViewPath($path)
    {
        return implode(DIRECTORY_SEPARATOR, [
            config('view.paths')[0] ?? resource_path('views'), $path,
        ]);
    }

    /**
     * Remove the installed Node modules.
     *
     * @return void
     */
    private function removeNodeModules()
    {
        tap(new Filesystem, function ($files) {
            $files->deleteDirectory(base_path('node_modules'));

            $files->delete(base_path('yarn.lock'));
        });
    }

    /**
     * Update the Webpack configuration.
     *
     * @return void
     */
    private function updateWebpackConfiguration()
    {
        file_put_contents(
            base_path('webpack.mix.js'),
            file_get_contents(__DIR__.'/../resources/stubs/webpack.stub'),
            FILE_APPEND
        );
    }
}
