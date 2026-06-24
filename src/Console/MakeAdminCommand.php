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

        if ($previousRole) {
            $this->info(sprintf(
                'Updated %s from %s to Admin.',
                $user->email,
                $previousRole->label(),
            ));
        } else {
            $this->info(sprintf('Assigned Admin to %s.', $user->email));
        }

        return self::SUCCESS;
    }
}
