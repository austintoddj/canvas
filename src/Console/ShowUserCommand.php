<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\ResolvesCanvasUsers;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Illuminate\Console\Command;

class ShowUserCommand extends Command
{
    use ResolvesCanvasUsers;

    protected $signature = 'canvas:show-user {user}';

    protected $description = 'Display the full Canvas profile for a user';

    public function handle(): int
    {
        $user = $this->resolveUser($this->argument('user'));

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
