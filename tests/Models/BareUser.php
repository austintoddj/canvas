<?php

declare(strict_types=1);

namespace Canvas\Tests\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Host user model without HasCanvasAccess — mirrors a minimal v7 integration.
 */
class BareUser extends Authenticatable
{
    use Notifiable;

    protected $table = 'users';

    protected $guarded = [];

    protected $hidden = [
        'password',
        'remember_token',
    ];
}
