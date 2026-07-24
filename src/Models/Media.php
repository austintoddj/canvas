<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\MediaFactory;
use Canvas\Enums\MediaType;
use Canvas\Support\MediaUrl;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @use HasFactory<MediaFactory>
 */
class Media extends Model
{
    /** @use HasFactory<MediaFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'canvas_media';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $perPage = 15;

    /** @var list<string> */
    protected $appends = [
        'url',
        'type',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    protected static function newFactory(): MediaFactory
    {
        return MediaFactory::new();
    }

    /**
     * @return BelongsTo<Model, $this>
     */
    public function user(): BelongsTo
    {
        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');

        return $this->belongsTo($userModel);
    }

    /**
     * @return Attribute<mixed, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(
            fn (): string => MediaUrl::forDiskPath((string) $this->path),
        );
    }

    /**
     * @return Attribute<mixed, never>
     */
    protected function type(): Attribute
    {
        return Attribute::get(
            fn (): ?string => MediaType::fromMimeType(
                isset($this->attributes['mime_type']) ? (string) $this->attributes['mime_type'] : null,
            )?->value,
        );
    }

    /**
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function scopeOwnedBy(Builder $query, object $user): Builder
    {
        return $query->where('user_id', data_get($user, 'id'));
    }

    /**
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        $like = '%'.$term.'%';

        return $query->where(function (Builder $builder) use ($like): void {
            $builder->where('filename', 'like', $like)
                ->orWhere('original_name', 'like', $like)
                ->orWhere('alt', 'like', $like)
                ->orWhere('caption', 'like', $like);
        });
    }

    /**
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function scopeOfMimeType(Builder $query, string $mimeType): Builder
    {
        return $query->where('mime_type', 'like', $mimeType.'%');
    }
}
