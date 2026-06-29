<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Models\CanvasUser;
use Canvas\Support\Localization;
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
                $canvasUser->username,
                $canvasUser->role->label(),
                Localization::resolveLocale($canvasUser->locale),
                $canvasUser->timezone ?? (string) config('app.timezone'),
            ])
            ->values()
            ->all();

        $this->table(['Name', 'Email', 'Username', 'Role', 'Locale', 'Timezone'], $rows);

        return self::SUCCESS;
    }
}
