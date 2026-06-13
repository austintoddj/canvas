<?php

namespace Canvas\Models;

use Canvas\Canvas;
use Canvas\Database\Factories\UserFactory;
use Illuminate\Auth\Authenticatable as AuthenticatableTrait;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model implements AuthenticatableContract
{
    use AuthenticatableTrait;
    use HasFactory;
    use SoftDeletes;

    /**
     * Role identifier for a Contributor.
     *
     * @const int
     */
    public const CONTRIBUTOR = 1;

    /**
     * Role identifier for an Editor.
     *
     * @const int
     */
    public const EDITOR = 2;

    /**
     * Role identifier for an Admin.
     *
     * @const int
     */
    public const ADMIN = 3;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_users';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * The attributes that should be casted.
     *
     * @var array
     */
    protected $casts = [
        'digest' => 'boolean',
        'dark_mode' => 'boolean',
        'role' => 'int',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'default_avatar',
        'default_locale',
    ];

    /**
     * The number of models to return for pagination.
     *
     * @var int
     */
    protected $perPage = 10;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return UserFactory::new();
    }

    /**
     * Get the posts relationship.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the tags relationship.
     */
    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Get the topics relationship.
     */
    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }

    /**
     * Check to see if the user is a Contributor.
     */
    public function getIsContributorAttribute(): bool
    {
        return $this->role === self::CONTRIBUTOR;
    }

    /**
     * Check to see if the user is an Editor.
     */
    public function getIsEditorAttribute(): bool
    {
        return $this->role === self::EDITOR;
    }

    /**
     * Check to see if the user is an Admin.
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->role === self::ADMIN;
    }

    /**
     * Return a default user avatar.
     */
    public function getDefaultAvatarAttribute(): string
    {
        return Canvas::gravatar($this->email ?? '');
    }

    /**
     * Return a default user locale.
     */
    public function getDefaultLocaleAttribute(): string
    {
        return config('app.locale');
    }
}
