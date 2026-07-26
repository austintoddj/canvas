<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\ResolvesCanvasUsers;
use Canvas\Enums\Role;
use Illuminate\Console\Command;

class MakeAdminCommand extends Command
{
    use ResolvesCanvasUsers;

    protected $signature = 'canvas:make-admin {user}';

    protected $description = 'Make a user an admin';

    public function handle(): int
    {
        $user = $this->resolveUser($this->argument('user'));
        $previousRole = $this->currentRole($user);
        $this->assignRole($user, Role::Admin);

        $email = (string) data_get($user, 'email', '');

        if ($previousRole) {
            $this->info(sprintf(
                'Updated %s from %s to Admin.',
                $email,
                $previousRole->label(),
            ));
        } else {
            $this->info(sprintf('Assigned Admin to %s.', $email));
        }

        return self::SUCCESS;
    }
}
