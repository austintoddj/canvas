<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\ResolvesCanvasUsers;
use Illuminate\Console\Command;

class ListUsersCommand extends Command
{
    use ResolvesCanvasUsers;

    protected $signature = 'canvas:list-users';

    protected $description = 'List users and their Canvas access';

    public function handle(): int
    {
        $userModel = $this->userModel();

        $rows = $userModel::query()
            ->with('canvasUser')
            ->orderBy('name')
            ->get()
            ->map(function ($user): array {
                $role = $user->canvasUser?->role;

                return [
                    $user->name,
                    $user->email,
                    $role?->label() ?? 'None',
                ];
            })
            ->all();

        $this->table(['Name', 'Email', 'Role'], $rows);

        return self::SUCCESS;
    }
}
