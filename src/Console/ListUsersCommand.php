<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Models\CanvasUser;
use Illuminate\Console\Command;

class ListUsersCommand extends Command
{
    protected $signature = 'canvas:list-users';

    protected $description = 'List users and their Canvas access';

    public function handle(): int
    {
        $rows = CanvasUser::query()
            ->with('user')
            ->get()
            ->sortBy(fn ($canvasUser) => $canvasUser->user?->name)
            ->map(fn ($canvasUser): array => [
                $canvasUser->user?->name,
                $canvasUser->user?->email,
                $canvasUser->role->label(),
            ])
            ->values()
            ->all();

        $this->table(['Name', 'Email', 'Role'], $rows);

        return self::SUCCESS;
    }
}
