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
        (new Filesystem)->ensureDirectoryExists(resource_path('sass/canvas-ui'));
        (new Filesystem)->ensureDirectoryExists(resource_path('js/canvas-ui'));

        // Blade layout view...
        $this->exportViews();

        // Routes and controller...
        $this->exportBackend();

        // NPM packages...
        $this->updateNodePackages(function ($packages) {
            return [
                'axios' => '^0.21.1',
                'bootstrap' => '^4.6.0',
                'highlight.js' => '^10.5.0',
                'jquery' => '^3.5.1',
                'laravel-mix' => '^6.0.49',
                'medium-zoom' => '^1.0.6',
                'moment' => '^2.29.1',
                'nprogress' => '^0.2.0',
                'popper.js' => '^1.16.1',
                'resolve-url-loader' => '^3.1.2',
                'sass' => '^1.32.4',
                'sass-loader' => '^10.1.1',
                'vue' => '^2.6.12',
                'vue-infinite-loading' => '^2.4.5',
                'vue-loader' => '^15.9.5',
                'vue-meta' => '^2.4.0',
                'vue-router' => '^3.4.9',
                'vue-template-compiler' => '^2.6.12',
            ] + $packages;
        });

        $this->updateNodeScripts(function ($scripts) {
            return [
                'canvas.ui.dev' => 'mix',
                'canvas.ui.prod' => 'mix --production',
            ] + $scripts;
        });

        // Sass configuration...
        copy(dirname(__DIR__, 2).'/resources/sass/ui.scss', resource_path('sass/canvas-ui.scss'));

        // Single page application...
        (new Filesystem)->copyDirectory(dirname(__DIR__, 2).'/resources/js/ui', resource_path('js/canvas-ui'));

        $this->updateWebpackConfiguration();
        $this->flushNodeModules();

        $this->info('Installation complete.');
        $this->comment('Please run "npm install && npm run canvas.ui.dev" to build your assets.');
    }

    /**
     * Update the "package.json" file.
     *
     * @param  callable  $callback
     * @param  bool  $dev
     * @return void
     */
    protected function updateNodePackages(callable $callback, $dev = true)
    {
        if (! file_exists(base_path('package.json'))) {
            return;
        }

        $configurationKey = $dev ? 'devDependencies' : 'dependencies';

        $packages = json_decode(file_get_contents(base_path('package.json')), true);

        $packages[$configurationKey] = $callback(
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
     * Update the "package.json" scripts.
     *
     * @param  callable  $callback
     * @param  bool  $dev
     * @return void
     */
    protected function updateNodeScripts(callable $callback)
    {
        if (! file_exists(base_path('package.json'))) {
            return;
        }

        $configurationKey = 'scripts';

        $packages = json_decode(file_get_contents(base_path('package.json')), true);

        $packages[$configurationKey] = $callback(
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
     * Export the authentication views.
     *
     * @return void
     */
    protected function exportViews()
    {
        if (file_exists($view = $this->getViewPath('canvas-ui.blade.php')) && ! $this->option('force')) {
            if (! $this->confirm('The [canvas-ui.blade.php] view already exists. Do you want to replace it?')) {
                return;
            }
        }

        copy(dirname(__DIR__, 2).'/resources/views/ui.blade.php', $view);
    }

    /**
     * Export the backend controller and routes.
     *
     * @return void
     */
    protected function exportBackend()
    {
        file_put_contents(
            app_path('Http/Controllers/CanvasUiController.php'),
            str_replace(
                '{{namespace}}',
                $this->laravel->getNamespace(),
                file_get_contents(dirname(__DIR__, 2).'/resources/stubs/controllers/CanvasUiController.stub')
            )
        );

        file_put_contents(
            base_path('routes/web.php'),
            file_get_contents(dirname(__DIR__, 2).'/resources/stubs/routes/web.stub'),
            FILE_APPEND
        );
    }

    /**
     * Get full view path relative to the application's configured view path.
     *
     * @param  string  $path
     * @return string
     */
    protected function getViewPath($path)
    {
        return implode(DIRECTORY_SEPARATOR, [
            config('view.paths')[0] ?? resource_path('views'), $path,
        ]);
    }

    /**
     * Delete the "node_modules" directory and remove the associated lock files.
     *
     * @return void
     */
    protected function flushNodeModules()
    {
        tap(new Filesystem, function ($files) {
            $files->deleteDirectory(base_path('node_modules'));

            $files->delete(base_path('yarn.lock'));
            $files->delete(base_path('package-lock.json'));
        });
    }

    /**
     * Update the Webpack configuration.
     *
     * @return void
     */
    protected function updateWebpackConfiguration()
    {
        file_put_contents(
            base_path('webpack.mix.js'),
            file_get_contents(dirname(__DIR__, 2).'/resources/stubs/webpack.mix.stub'),
            FILE_APPEND
        );
    }
}
