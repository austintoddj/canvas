<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum UserPreference: string
{
    case Onboarding = 'onboarding';

    /**
     * @param  array<string, mixed>  $preferences
     */
    public function isComplete(array $preferences): bool
    {
        return (bool) data_get($preferences, "{$this->value}.complete", false);
    }
}
