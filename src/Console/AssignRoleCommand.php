<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\ResolvesCanvasUsers;
use Illuminate\Console\Command;

class AssignRoleCommand extends Command
{
    use ResolvesCanvasUsers;

    protected $signature = 'canvas:assign-role {user} {role}';

    protected $description = 'Assign a Canvas role to a user';

    public function handle(): int
    {
        $user = $this->resolveUser($this->argument('user'));
        $role = $this->resolveRole($this->argument('role'));

        if (! $role) {
            $this->error('Please enter a valid role.');

            return self::SUCCESS;
        }

        $previousRole = $this->currentRole($user);
        $this->assignRole($user, $role);

        if ($previousRole) {
            $this->info(sprintf(
                'Updated %s from %s to %s.',
                $user->email,
                $previousRole->label(),
                $role->label(),
            ));
        } else {
            $this->info(sprintf('Assigned %s to %s.', $role->label(), $user->email));
        }

        return self::SUCCESS;
    }
}
