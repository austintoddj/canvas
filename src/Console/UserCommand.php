<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Canvas;
use Canvas\Models\User;
use Faker\Factory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

class UserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:user { role : The role to be assigned }';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new user for Canvas';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $user = User::query()->make();

        switch ($this->argument('role')) {
            case 'admin':
                $user->fill([
                    'role' => User::ADMIN,
                ]);
                break;

            case 'editor':
                $user->fill([
                    'role' => User::EDITOR,
                ]);
                break;

            case 'contributor':
                $user->fill([
                    'role' => User::CONTRIBUTOR,
                ]);
                break;

            default:
                $this->error('Please enter a valid role. [contributor|editor|admin]');

                return;
        }

        $email = $this->ask('What email should be attached to the user?');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Please enter a valid email.');

            return;
        }

        $password = 'password';

        $user->fill([
            'id' => Uuid::uuid4()->toString(),
            'name' => Factory::create()->name,
            'email' => $email,
            'password' => Hash::make($password),
            'avatar' => Canvas::gravatar($email),
        ]);

        $user->save();

        $this->info('New user created.');
        $this->table(['Email', 'Password'], [[$email, $password]]);
        $this->info('First things first, head to <info>'.route('canvas.login').'</info> and update your credentials.');
    }
}
