<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\PostFactory;
use Canvas\Support\ReadTime;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @use HasFactory<PostFactory>
 */
class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'canvas_posts';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $perPage = 10;

    /** @var list<string> */
    protected $appends = [
        'read_time',
        'has_pending_changes',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
        'published_at' => 'datetime',
        'meta' => 'array',
        'pending' => 'array',
    ];

    protected static function newFactory(): PostFactory
    {
        return PostFactory::new();
    }

    /**
     * @return BelongsToMany<Tag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            Tag::class,
            'canvas_posts_tags',
            'post_id',
            'tag_id'
        );
    }

    /**
     * @return BelongsTo<Topic, $this>
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
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
     * @return HasMany<View, $this>
     */
    public function views(): HasMany
    {
        return $this->hasMany(View::class);
    }

    /**
     * @return HasMany<Visit, $this>
     */
    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }

    /**
     * @return HasMany<PostRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(PostRevision::class);
    }

    public function getReadTimeAttribute(): string
    {
        return ReadTime::calculate($this->body, app()->getLocale());
    }

    public function getPublishedAttribute(): bool
    {
        return ! is_null($this->published_at) && $this->published_at <= now()->toDateTimeString();
    }

    public function getHasPendingChangesAttribute(): bool
    {
        return is_array($this->pending) && $this->pending !== [];
    }

    /**
     * Persist editor state as unpublished changes without mutating the public snapshot.
     *
     * When the payload matches the live public snapshot, clear any existing pending
     * row instead of storing a no-op diff (e.g. autosave right after promote).
     *
     * @param  array<string, mixed>  $data
     * @param  array<int, array{name?: string, slug?: string}>  $tags
     * @param  array<int, array{name?: string, slug?: string}>  $topic
     */
    public function writePending(array $data, array $tags = [], array $topic = []): void
    {
        $pending = $this->buildPendingPayload($data, $tags, $topic);

        if ($this->pendingPayloadMatchesLive($pending)) {
            if ($this->has_pending_changes) {
                $this->clearPending();
                $this->save();
            }

            return;
        }

        $this->pending = $pending;
        $this->save();
    }

    public function clearPending(): void
    {
        $this->pending = null;
    }

    /**
     * Drop a pending blob that no longer differs from the public snapshot.
     * Safe to call on editor load so no-op pending does not stick forever.
     */
    public function reconcileNoOpPending(): void
    {
        if (! $this->has_pending_changes || ! is_array($this->pending)) {
            return;
        }

        if (! $this->pendingPayloadMatchesLive($this->pending)) {
            return;
        }

        $this->clearPending();
        $this->save();
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, array{name?: string, slug?: string}>  $tags
     * @param  array<int, array{name?: string, slug?: string}>  $topic
     * @return array{
     *     title: mixed,
     *     slug: mixed,
     *     summary: mixed,
     *     body: mixed,
     *     featured_image: mixed,
     *     featured_image_caption: mixed,
     *     meta: mixed,
     *     tags: list<array{name: string, slug: string}>,
     *     topic: array{name: string, slug: string}|null
     * }
     */
    public function buildPendingPayload(array $data, array $tags = [], array $topic = []): array
    {
        $topicInput = collect($topic)->first();

        return [
            'title' => $data['title'] ?? $this->title,
            'slug' => $data['slug'] ?? $this->slug,
            'summary' => array_key_exists('summary', $data) ? $data['summary'] : $this->summary,
            'body' => array_key_exists('body', $data) ? $data['body'] : $this->body,
            'featured_image' => array_key_exists('featured_image', $data) ? $data['featured_image'] : $this->featured_image,
            'featured_image_caption' => array_key_exists('featured_image_caption', $data)
                ? $data['featured_image_caption']
                : $this->featured_image_caption,
            'meta' => array_key_exists('meta', $data) ? $data['meta'] : $this->meta,
            'tags' => collect($tags)
                ->filter(fn (array $tag): bool => filled($tag['slug'] ?? null))
                ->map(fn (array $tag): array => [
                    'name' => (string) ($tag['name'] ?? $tag['slug']),
                    'slug' => (string) $tag['slug'],
                ])
                ->values()
                ->all(),
            'topic' => is_array($topicInput) && filled($topicInput['slug'] ?? null)
                ? [
                    'name' => (string) ($topicInput['name'] ?? $topicInput['slug']),
                    'slug' => (string) $topicInput['slug'],
                ]
                : null,
        ];
    }

    /**
     * @param  array{
     *     title?: mixed,
     *     slug?: mixed,
     *     summary?: mixed,
     *     body?: mixed,
     *     featured_image?: mixed,
     *     featured_image_caption?: mixed,
     *     meta?: mixed,
     *     tags?: list<array{name?: string, slug?: string}>,
     *     topic?: array{name?: string, slug?: string}|null
     * }  $pending
     */
    public function pendingPayloadMatchesLive(array $pending): bool
    {
        $this->loadMissing(['tags:name,slug', 'topic:id,name,slug']);

        if (! $this->scalarFieldsMatchLive($pending)) {
            return false;
        }

        if (! $this->metaMatchesLive($pending['meta'] ?? null)) {
            return false;
        }

        return $this->taxonomyMatchesLive($pending['tags'] ?? [], $pending['topic'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $pending
     */
    private function scalarFieldsMatchLive(array $pending): bool
    {
        $fields = ['title', 'slug', 'summary', 'body', 'featured_image', 'featured_image_caption'];

        foreach ($fields as $field) {
            if (! array_key_exists($field, $pending)) {
                continue;
            }

            if (! $this->nullableStringsEqual($pending[$field] ?? null, $this->getAttribute($field))) {
                return false;
            }
        }

        return true;
    }

    private function metaMatchesLive(mixed $pendingMeta): bool
    {
        $liveMeta = $this->meta;

        if ($pendingMeta === null || $pendingMeta === []) {
            return $liveMeta === null || $liveMeta === [];
        }

        if (! is_array($pendingMeta) || ! is_array($liveMeta)) {
            return $pendingMeta === $liveMeta;
        }

        return $this->normalizeAssociative($pendingMeta) === $this->normalizeAssociative($liveMeta);
    }

    /**
     * @param  list<array{name?: string, slug?: string}>  $pendingTags
     * @param  array{name?: string, slug?: string}|null  $pendingTopic
     */
    private function taxonomyMatchesLive(array $pendingTags, ?array $pendingTopic): bool
    {
        $liveTagSlugs = $this->tags
            ->pluck('slug')
            ->filter()
            ->map(fn (mixed $slug): string => (string) $slug)
            ->sort()
            ->values()
            ->all();

        $pendingTagSlugs = collect($pendingTags)
            ->pluck('slug')
            ->filter()
            ->map(fn (mixed $slug): string => (string) $slug)
            ->sort()
            ->values()
            ->all();

        if ($liveTagSlugs !== $pendingTagSlugs) {
            return false;
        }

        $liveTopicSlug = $this->topic?->slug;
        $pendingTopicSlug = is_array($pendingTopic) ? ($pendingTopic['slug'] ?? null) : null;

        return $this->nullableStringsEqual($liveTopicSlug, $pendingTopicSlug);
    }

    private function nullableStringsEqual(mixed $left, mixed $right): bool
    {
        $normalize = static function (mixed $value): ?string {
            if ($value === null) {
                return null;
            }

            if (! is_scalar($value)) {
                return null;
            }

            $string = (string) $value;

            return $string === '' ? null : $string;
        };

        return $normalize($left) === $normalize($right);
    }

    /**
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    private function normalizeAssociative(array $value): array
    {
        ksort($value);

        foreach ($value as $key => $item) {
            if (is_array($item)) {
                $value[$key] = $this->normalizeAssociative($item);
            } elseif ($item === '') {
                $value[$key] = null;
            }
        }

        return $value;
    }

    /**
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published_at', '<=', now()->toDateTimeString());
    }

    /**
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q
            ->whereNull('published_at')
            ->orWhere('published_at', '>', now())
        );
    }

    protected static function booted(): void
    {
        static::deleting(function (self $post): void {
            $post->tags()->detach();
        });
    }
}
