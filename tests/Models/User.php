<?php

declare(strict_types=1);

namespace Canvas\Tests\Models;

use Canvas\Canvas;
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
        'default_avatar',
        'default_locale',
    ];

    protected $keyType = 'string';

    public $incrementing = false;

    protected static function newFactory(): Factory
    {
        return UserFactory::new();
    }

    public function getDefaultAvatarAttribute(): string
    {
        return Canvas::gravatar($this->email ?? '');
    }

    public function getDefaultLocaleAttribute(): string
    {
        return config('app.locale');
    }
}
