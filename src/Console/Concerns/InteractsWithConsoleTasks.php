<?php

declare(strict_types=1);

namespace Canvas\Console\Concerns;

use Illuminate\Console\View\TaskResult;

trait InteractsWithConsoleTasks
{
    protected function taskResult(int $exitCode): int
    {
        return $exitCode === self::SUCCESS
            ? TaskResult::Success->value
            : TaskResult::Failure->value;
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    protected function runSilentTask(string $command, array $parameters = []): int
    {
        return $this->taskResult($this->callSilent($command, $parameters));
    }
}
