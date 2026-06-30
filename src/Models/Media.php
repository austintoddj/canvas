<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\MediaFactory;
use Canvas\Enums\MediaType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'canvas_media';

    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $perPage = 15;

    protected $appends = [
        'url',
        'type',
    ];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    protected static function newFactory(): Factory
    {
        return MediaFactory::new();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(config('canvas.user_model'));
    }

    protected function url(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->path !== null
                ? Storage::disk((string) config('canvas.storage_disk'))->url($this->path)
                : null,
        );
    }

    protected function type(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->mime_type !== null
                ? MediaType::fromMimeType($this->mime_type)?->value
                : null,
        );
    }

    public function scopeOwnedBy(Builder $query, object $user): Builder
    {
        return $query->where('user_id', $user->id);
    }

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

    public function scopeOfMimeType(Builder $query, string $mimeType): Builder
    {
        return $query->where('mime_type', 'like', $mimeType.'%');
    }
}
