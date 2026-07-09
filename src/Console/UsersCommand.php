<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\ResolvesCanvasUsers;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Canvas\Support\Localization;
use Illuminate\Console\Command;

class UsersCommand extends Command
{
    use ResolvesCanvasUsers;

    protected $signature = 'canvas:users {user? : The ID or email of a user to inspect}';

    protected $description = 'List users with Canvas access, or display the full profile for one user';

    public function handle(): int
    {
        $user = $this->argument('user');

        return $user === null ? $this->listUsers() : $this->showUser($user);
    }

    protected function listUsers(): int
    {
        $rows = CanvasUser::query()
            ->with('user')
            ->get()
            ->sortBy(fn (CanvasUser $canvasUser): mixed => data_get($canvasUser->user, 'name'))
            ->map(fn (CanvasUser $canvasUser): array => [
                data_get($canvasUser->user, 'name'),
                data_get($canvasUser->user, 'email'),
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

    protected function showUser(int|string $identifier): int
    {
        $user = $this->resolveUser($identifier);

        $canvasUser = CanvasUser::query()->firstWhere('user_id', $user->getKey());

        if ($canvasUser === null) {
            $this->error(sprintf('%s does not have Canvas access.', (string) data_get($user, 'email', '')));

            return self::FAILURE;
        }

        $user->setRelation('canvasUser', $canvasUser);

        $this->line(json_encode(
            UserResource::make($user)->resolve(),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
        ));

        return self::SUCCESS;
    }
}
