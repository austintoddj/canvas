<?php

declare(strict_types=1);

namespace Canvas\Support;

use Composer\InstalledVersions;

final class Version
{
    public static function installed(): string
    {
        if (app()->runningUnitTests()) {
            return '';
        }

        return InstalledVersions::getPrettyVersion('austintoddj/canvas');
    }
}
