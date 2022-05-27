<?php

declare(strict_types=1);

namespace Canvas\Console;

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
    protected $signature = 'canvas:user';

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
        $email = $this->ask('What email should be attached to the user?');
        $password = 'password';

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Please enter a valid email.');

            return;
        }

        if (User::query()->where('email', $email)->exists()) {
            $this->error('That email already exists in the system.');

            return;
        }

        $role = $this->choice(
            'What role should the user have?',
            User::roles(),
            User::$contributor_id,
            $maxAttempts = 3,
            $allowMultipleSelections = false
        );

        User::query()->create([
            'id' => Uuid::uuid4()->toString(),
            'name' => Factory::create()->name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => array_search($role, User::roles()),
        ]);

        $this->info('New user created.');
        $this->table(['Email', 'Password'], [[$email, $password]]);
        $this->info('First things first, head to <info>'.route('canvas.login').'</info> and update your credentials.');
    }
}
