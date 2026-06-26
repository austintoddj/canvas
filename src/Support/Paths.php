<?php

declare(strict_types=1);

namespace Canvas\Support;

final class Paths
{
    public static function basePath(): string
    {
        return sprintf('/%s', config('canvas.path'));
    }

    public static function baseStoragePath(): string
    {
        return sprintf('%s/images', config('canvas.storage_path'));
    }
}
