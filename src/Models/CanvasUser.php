<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Data\UserPreferences;
use Canvas\Database\Factories\CanvasUserFactory;
use Canvas\Enums\Role;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read int|null $posts_count
 *
 * @use HasFactory<CanvasUserFactory>
 */
class CanvasUser extends Model
{
    /** @use HasFactory<CanvasUserFactory> */
    use HasFactory;

    protected $table = 'canvas_users';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    /** @var list<string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
        'digest' => 'boolean',
        'role' => Role::class,
        'social' => 'array',
        'preferences' => 'array',
    ];

    protected static function newFactory(): CanvasUserFactory
    {
        return CanvasUserFactory::new();
    }

    /**
     * @return BelongsTo<Model, $this>
     */
    public function user(): BelongsTo
    {
        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');

        return $this->belongsTo($userModel, 'user_id');
    }

    /**
     * @param  Builder<CanvasUser>  $query
     * @return Builder<CanvasUser>
     */
    public function scopeWithPostsCount(Builder $query): Builder
    {
        return $query->addSelect([
            'posts_count' => Post::query()
                ->selectRaw('count(*)')
                ->whereColumn('canvas_posts.user_id', 'canvas_users.user_id'),
        ]);
    }

    public static function roleFor(object $user): ?Role
    {
        if ($user instanceof Model && $user->relationLoaded('canvasUser')) {
            $canvasUser = $user->getRelation('canvasUser');

            return $canvasUser instanceof self ? $canvasUser->role : null;
        }

        $userId = $user instanceof Model
            ? $user->getKey()
            : ($user instanceof Authenticatable ? $user->getAuthIdentifier() : null);

        if ($userId === null) {
            return null;
        }

        return static::query()->find($userId)?->role;
    }

    public static function isAdmin(object $user): bool
    {
        return self::roleFor($user) === Role::Admin;
    }

    public static function isContributor(object $user): bool
    {
        return self::roleFor($user) === Role::Contributor;
    }

    /**
     * @return array<string, mixed>
     */
    public function resolvedPreferences(): array
    {
        return UserPreferences::resolve($this->preferences);
    }

    /**
     * @return array<string, string>
     */
    public function socialLinks(): array
    {
        return is_array($this->social) ? $this->social : [];
    }
}
