<?php

namespace Canvas\Console;

use Canvas\Helpers\URL;
use Canvas\Models\User;
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
    protected $signature = 'canvas:user
                    { role : The role to be assigned (admin, editor, contributor) }
                    { --email= : Email associated with the user }';

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
        if (! filter_var($this->option('email'), FILTER_VALIDATE_EMAIL)) {
            $this->error('Please enter a valid email.');

            return;
        }

        $email = $this->option('email');
        $password = 'password';

        $user = new User();
        $user->fill([
            'id' => Uuid::uuid4()->toString(),
            'email' => $email,
            'password' => Hash::make($password),
            'avatar' => URL::gravatar($email),
        ]);

        switch ($this->argument('role')) {
            case 'admin':
                $user->fill([
                    'name' => 'New Admin',
                    'role' => User::ADMIN,
                ]);
                break;

            case 'editor':
                $user->fill([
                    'name' => 'New Editor',
                    'role' => User::EDITOR,
                ]);
                break;

            case 'contributor':
                $user->fill([
                    'name' => 'New Contributor',
                    'role' => User::CONTRIBUTOR,
                ]);
                break;

            default:
                $this->error('Please enter a valid role.');

                return;
        }

        $user->save();

        $this->info('New user created.');
        $this->table(['Email', 'Password'], [[$email, $password]]);
        $this->info('First things first, login at <info>'.route('canvas.login').'</info> and update your credentials.');
    }
}
