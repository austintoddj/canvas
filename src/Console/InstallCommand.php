<?php

namespace Canvas\Console;

use Canvas\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InstallCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:install {--force : Force the operation to run when in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install the resources and run migrations';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-provider']);
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-assets']);
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-config']);
        $this->callSilent('migrate', [
            '--path' => 'vendor/austintoddj/canvas/src/database/migrations',
            '--force' => $this->option('force') ?? true,
        ]);

        $this->registerCanvasServiceProvider();

        $this->createDefaultUser($email = 'email@example.com', $password = 'password');

        $this->info('Installation complete.');
        $this->table(['Default Email', 'Default Password'], [[$email, $password]]);
        $this->info('First things first, login at <info>'.route('canvas.login').'</info> and update your credentials.');
    }

    /**
     * Create a default user.
     *
     * @param string $email
     * @param string $password
     */
    private function createDefaultUser(string $email, string $password)
    {
        User::create([
            'name' => 'Example User',
            'email' => $email,
            'password' => Hash::make($password),
            'role' => User::ADMIN,
        ]);
    }

    /**
     * Register the Canvas service provider in the application configuration file.
     *
     * @return void
     */
    private function registerCanvasServiceProvider()
    {
        $namespace = Str::replaceLast('\\', '', $this->laravel->getNamespace());
        $appConfig = file_get_contents(config_path('app.php'));

        if (Str::contains($appConfig, $namespace.'\\Providers\\CanvasServiceProvider::class')) {
            return;
        }

        $lineEndingCount = [
            "\r\n" => substr_count($appConfig, "\r\n"),
            "\r" => substr_count($appConfig, "\r"),
            "\n" => substr_count($appConfig, "\n"),
        ];

        $eol = array_keys($lineEndingCount, max($lineEndingCount))[0];

        file_put_contents(config_path('app.php'), str_replace(
            "{$namespace}\\Providers\EventServiceProvider::class,".$eol,
            "{$namespace}\\Providers\EventServiceProvider::class,".$eol."        {$namespace}\Providers\CanvasServiceProvider::class,".$eol,
            $appConfig
        ));

        file_put_contents(app_path('Providers/CanvasServiceProvider.php'), str_replace(
            "namespace App\Providers;",
            "namespace {$namespace}\Providers;",
            file_get_contents(app_path('Providers/CanvasServiceProvider.php'))
        ));
    }
}
