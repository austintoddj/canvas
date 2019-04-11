<?php

namespace Canvas\Console;

use Illuminate\Support\Str;
use Illuminate\Console\Command;
use Illuminate\Console\DetectsApplicationNamespace;

class InstallCommand extends Command
{
    use DetectsApplicationNamespace;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:install';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install all of the Canvas resources';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $this->comment('Publishing the service provider...');
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-provider']);

        $this->comment('Publishing the assets...');
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-assets']);

        $this->comment('Publishing the configuration file...');
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-config']);

        $this->comment('Running the database migrations...');
        $this->callSilent('migrate');

        $this->registerCanvasServiceProvider();

        $this->line('');
        $this->line('<info>[✔]</info> Canvas is installed and ready to use. Enjoy!');
    }

    /**
     * Register the Canvas service provider in the application configuration file.
     *
     * @return void
     *
     * @author Taylor Otwell <taylor@laravel.com>
     */
    private function registerCanvasServiceProvider()
    {
        $namespace = Str::replaceLast('\\', '', $this->getAppNamespace());
        $appConfig = file_get_contents(config_path('app.php'));

        if (Str::contains($appConfig, $namespace.'\\Providers\\CanvasServiceProvider::class')) {
            return;
        }

        $lineEndingCount = [
            "\r\n" => substr_count($appConfig, "\r\n"),
            "\r"   => substr_count($appConfig, "\r"),
            "\n"   => substr_count($appConfig, "\n"),
        ];

        $eol = array_keys($lineEndingCount, max($lineEndingCount))[0];

        file_put_contents(config_path('app.php'), str_replace(
            "{$namespace}\\Providers\EventServiceProvider::class,".$eol,
            "{$namespace}\\Providers\EventServiceProvider::class,".$eol
                ."{$namespace}\Providers\CanvasServiceProvider::class,".$eol,
            $appConfig
        ));

        file_put_contents(app_path('Providers/CanvasServiceProvider.php'), str_replace(
            "namespace App\Providers;",
            "namespace {$namespace}\Providers;",
            file_get_contents(app_path('Providers/CanvasServiceProvider.php'))
        ));
    }
}
