<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Data\UserPreferences;
use Canvas\Database\Factories\CanvasUserFactory;
use Canvas\Enums\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CanvasUser extends Model
{
    use HasFactory;

    protected $table = 'canvas_users';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $guarded = [];

    protected $casts = [
        'dark_mode' => 'boolean',
        'digest' => 'boolean',
        'role' => Role::class,
        'social' => 'array',
        'preferences' => 'array',
    ];

    protected static function newFactory(): Factory
    {
        return CanvasUserFactory::new();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(config('canvas.user_model'), 'user_id');
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
