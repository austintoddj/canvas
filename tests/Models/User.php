<?php

declare(strict_types=1);

namespace Canvas\Tests\Models;

use Canvas\Concerns\HasCanvasAccess;
use Canvas\Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasCanvasAccess;
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $table = 'users';

    protected $guarded = [];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'default_locale',
    ];

    protected static function newFactory(): Factory
    {
        return UserFactory::new();
    }
}
