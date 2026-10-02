<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\MediaTagFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @use HasFactory<MediaTagFactory>
 */
class MediaTag extends Model
{
    /** @use HasFactory<MediaTagFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'canvas_media_tags';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
    ];

    protected static function newFactory(): MediaTagFactory
    {
        return MediaTagFactory::new();
    }

    public static function slugFor(string $name): string
    {
        $slug = Str::slug(trim($name));

        if ($slug !== '') {
            return $slug;
        }

        return 'tag-'.substr(hash('sha256', mb_strtolower(trim($name), 'UTF-8')), 0, 12);
    }

    /**
     * @return BelongsToMany<Media, $this>
     */
    public function media(): BelongsToMany
    {
        return $this->belongsToMany(
            Media::class,
            'canvas_media_tag',
            'media_tag_id',
            'media_id',
        );
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

    protected static function booted(): void
    {
        static::deleting(function (self $tag): void {
            $tag->media()->detach();
        });
    }
}
