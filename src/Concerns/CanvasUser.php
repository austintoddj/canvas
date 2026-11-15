<?php

declare(strict_types=1);

namespace Canvas\Concerns;

use Illuminate\Database\Eloquent\Model;

/** @mixin Model */
trait CanvasUser
{
    public function getCanvasNameAttribute(): string
    {
        return $this->getAttributeValue('name') ?? '';
    }
}
