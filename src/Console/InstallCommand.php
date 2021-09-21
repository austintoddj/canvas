<?php

namespace Canvas\Console;

use Canvas\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class InstallCommand extends Command
{
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
    protected $description = 'Install the Canvas components and resources';

    /**
     * Create a new console command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();

        if (file_exists(config_path('canvas.php'))) {
            $this->setHidden(true);
        }
    }

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
        $this->callSilent('canvas:migrate');

        if (! app()->runningUnitTests()) {
            $this->installCanvasServiceProvider();
        }

        $this->createDefaultUser($email = 'email@example.com', $password = 'password');

        $this->info('Installation complete.');
        $this->table(['Default Email', 'Default Password'], [[$email, $password]]);
        $this->info('First things first, head to <comment>'.route('canvas.login').'</comment> and update your credentials.');
    }

    /**
     * Create a new default user.
     *
     * @param  string  $email
     * @param  string  $password
     * @return void
     */
    protected function createDefaultUser(string $email, string $password)
    {
        User::create([
            'id' => Uuid::uuid4()->toString(),
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
    protected function installCanvasServiceProvider()
    {
        if (! Str::contains($appConfig = file_get_contents(config_path('app.php')), 'App\\Providers\\CanvasServiceProvider::class')) {
            file_put_contents(config_path('app.php'), str_replace(
                "App\\Providers\RouteServiceProvider::class,",
                "App\\Providers\RouteServiceProvider::class,".PHP_EOL."        App\Providers\CanvasServiceProvider::class,",
                $appConfig
            ));
        }
    }
}
