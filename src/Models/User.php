<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Canvas;
use Canvas\Database\Factories\UserFactory;
use Canvas\Traits\HasRole;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends AbstractCanvasModel implements Authenticatable
{
    use HasFactory, HasRole, SoftDeletes;

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
        'dark_mode' => 'boolean',
        'digest' => 'boolean',
        'role' => 'int',
        'social' => 'array',
        'meta' => 'array',
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
     * Get the posts relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the tags relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function tags()
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Get the topics relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function topics()
    {
        return $this->hasMany(Topic::class);
    }

    /**
     * Check to see if the user is a Contributor.
     *
     * @return bool
     */
    public function getIsContributorAttribute()
    {
        return is_null($this->role) || $this->role === self::$contributor_id;
    }

    /**
     * Check to see if the user is an Editor.
     *
     * @return bool
     */
    public function getIsEditorAttribute()
    {
        return $this->role === self::$editor_id;
    }

    /**
     * Check to see if the user is an Admin.
     *
     * @return bool
     */
    public function getIsAdminAttribute()
    {
        return $this->role === self::$admin_id;
    }

    /**
     * Return a default user avatar.
     *
     * @return string
     */
    public function getDefaultAvatarAttribute()
    {
        return Canvas::gravatar($this->email ?? '');
    }

    /**
     * Return a default user locale.
     *
     * @return string
     */
    public function getDefaultLocaleAttribute()
    {
        return config('app.locale');
    }

    /**
     * Get the name of the unique identifier for the user.
     *
     * @return string
     */
    public function getAuthIdentifierName()
    {
        return $this->getKeyName();
    }

    /**
     * Get the unique identifier for the user.
     *
     * @return mixed
     */
    public function getAuthIdentifier()
    {
        return $this->{$this->getAuthIdentifierName()};
    }

    /**
     * Get the password for the user.
     *
     * @return string
     */
    public function getAuthPassword()
    {
        return $this->password;
    }

    /**
     * Get the token value for the "remember me" session.
     *
     * @return string|null
     */
    public function getRememberToken()
    {
        if (! empty($this->getRememberTokenName())) {
            return (string) $this->{$this->getRememberTokenName()};
        }
    }

    /**
     * Set the token value for the "remember me" session.
     *
     * @param  string  $value
     * @return void
     */
    public function setRememberToken($value)
    {
        if (! empty($this->getRememberTokenName())) {
            $this->{$this->getRememberTokenName()} = $value;
        }
    }

    /**
     * Get the column name for the "remember me" token.
     *
     * @return string
     */
    public function getRememberTokenName()
    {
        return $this->rememberTokenName;
    }

    /**
     * Create a new factory instance for the model.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    protected static function newFactory()
    {
        return UserFactory::new();
    }

    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function (self $user) {
            $user->posts()->delete();
            $user->tags()->delete();
            $user->topics()->delete();
        });
    }
}
