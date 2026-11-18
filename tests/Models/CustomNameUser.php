<?php

declare(strict_types=1);

namespace Canvas\Tests\Models;

class CustomNameUser extends BareUser
{
    protected $hidden = [];

    public function getCanvasNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
