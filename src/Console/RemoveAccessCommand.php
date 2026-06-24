<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Console\Concerns\ResolvesCanvasUsers;
use Illuminate\Console\Command;

class RemoveAccessCommand extends Command
{
    use ResolvesCanvasUsers;

    protected $signature = 'canvas:remove-access {user}';

    protected $description = 'Remove a user’s Canvas access';

    public function handle(): int
    {
        $user = $this->resolveUser($this->argument('user'));
        $this->removeAccess($user);

        $this->info(sprintf('Removed access for %s.', $user->email));

        return self::SUCCESS;
    }
}
