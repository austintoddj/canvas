<?php

declare(strict_types=1);

namespace Canvas\Tests\Models;

use Canvas\Concerns\CanvasUser;

class CustomNameUser extends BareUser
{
    use CanvasUser;

    protected $hidden = [];

    public function getCanvasNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
