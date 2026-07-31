<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\Post;
use DateTimeInterface;
use Illuminate\Support\Carbon;

/**
 * Immutable public-state capture for lifecycle classification.
 *
 * Fingerprint covers fields that form the public snapshot (not pending JSON).
 */
final readonly class PostSnapshot
{
    /**
     * @param  array<string, mixed>|null  $meta
     * @param  list<string>  $tagSlugs
     */
    public function __construct(
        public bool $isLive,
        public bool $isScheduled,
        public bool $isDraft,
        public ?string $title,
        public ?string $slug,
        public ?string $summary,
        public ?string $body,
        public ?string $featuredImage,
        public ?string $featuredImageCaption,
        public ?string $publishedAt,
        public ?array $meta,
        public ?string $topicId,
        public array $tagSlugs,
    ) {}

    public static function from(Post $post): self
    {
        $post->loadMissing(['tags:id,slug', 'topic:id,slug']);

        $publishedAt = self::normalizeDateTime($post->published_at);
        $isLive = $publishedAt !== null && $publishedAt <= now()->format('Y-m-d H:i:s');
        $isScheduled = $publishedAt !== null && ! $isLive;
        $isDraft = $publishedAt === null;

        $tagSlugs = $post->tags
            ->pluck('slug')
            ->filter()
            ->map(static fn (mixed $slug): string => (string) $slug)
            ->sort()
            ->values()
            ->all();

        $meta = $post->meta;
        if (! is_array($meta)) {
            $meta = null;
        }

        return new self(
            isLive: $isLive,
            isScheduled: $isScheduled,
            isDraft: $isDraft,
            title: self::nullableString($post->title),
            slug: self::nullableString($post->slug),
            summary: self::nullableString($post->summary),
            body: self::nullableString($post->body),
            featuredImage: self::nullableString($post->featured_image),
            featuredImageCaption: self::nullableString($post->featured_image_caption),
            publishedAt: $publishedAt,
            meta: $meta === null ? null : self::normalizeAssociative($meta),
            topicId: self::nullableString($post->topic_id),
            tagSlugs: $tagSlugs,
        );
    }

    /**
     * Same public fields as {@see from()}, but forced to scheduled visibility.
     *
     * Used when a post is already live by the clock so lifecycle classification
     * can still see scheduled → live (time elapsed without an editor write).
     */
    public static function asScheduled(Post $post): self
    {
        $base = self::from($post);

        return new self(
            isLive: false,
            isScheduled: true,
            isDraft: false,
            title: $base->title,
            slug: $base->slug,
            summary: $base->summary,
            body: $base->body,
            featuredImage: $base->featuredImage,
            featuredImageCaption: $base->featuredImageCaption,
            publishedAt: $base->publishedAt,
            meta: $base->meta,
            topicId: $base->topicId,
            tagSlugs: $base->tagSlugs,
        );
    }

    /**
     * Build a snapshot from explicit public fields (unit tests / classifiers without DB).
     *
     * @param  array{
     *     title?: string|null,
     *     slug?: string|null,
     *     summary?: string|null,
     *     body?: string|null,
     *     featured_image?: string|null,
     *     featured_image_caption?: string|null,
     *     published_at?: DateTimeInterface|string|null,
     *     meta?: array<string, mixed>|null,
     *     topic_id?: string|null,
     *     tag_slugs?: list<string>
     * }  $attributes
     */
    public static function make(array $attributes): self
    {
        $publishedAt = self::normalizeDateTime($attributes['published_at'] ?? null);
        $isLive = $publishedAt !== null && $publishedAt <= now()->format('Y-m-d H:i:s');
        $isScheduled = $publishedAt !== null && ! $isLive;
        $isDraft = $publishedAt === null;

        $meta = $attributes['meta'] ?? null;
        if (! is_array($meta)) {
            $meta = null;
        }

        $tagSlugs = $attributes['tag_slugs'] ?? [];
        $tagSlugs = collect($tagSlugs)
            ->filter()
            ->map(static fn (mixed $slug): string => (string) $slug)
            ->sort()
            ->values()
            ->all();

        return new self(
            isLive: $isLive,
            isScheduled: $isScheduled,
            isDraft: $isDraft,
            title: self::nullableString($attributes['title'] ?? null),
            slug: self::nullableString($attributes['slug'] ?? null),
            summary: self::nullableString($attributes['summary'] ?? null),
            body: self::nullableString($attributes['body'] ?? null),
            featuredImage: self::nullableString($attributes['featured_image'] ?? null),
            featuredImageCaption: self::nullableString($attributes['featured_image_caption'] ?? null),
            publishedAt: $publishedAt,
            meta: $meta === null ? null : self::normalizeAssociative($meta),
            topicId: isset($attributes['topic_id']) ? self::nullableString($attributes['topic_id']) : null,
            tagSlugs: $tagSlugs,
        );
    }

    public function visibility(): string
    {
        if ($this->isLive) {
            return 'live';
        }

        if ($this->isScheduled) {
            return 'scheduled';
        }

        return 'draft';
    }

    public function fingerprintEquals(self $other): bool
    {
        return $this->fingerprint() === $other->fingerprint();
    }

    /**
     * @return array{
     *     title: string|null,
     *     slug: string|null,
     *     summary: string|null,
     *     body: string|null,
     *     featured_image: string|null,
     *     featured_image_caption: string|null,
     *     published_at: string|null,
     *     meta: array<string, mixed>|null,
     *     topic_id: string|null,
     *     tag_slugs: list<string>
     * }
     */
    public function fingerprint(): array
    {
        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'body' => $this->body,
            'featured_image' => $this->featuredImage,
            'featured_image_caption' => $this->featuredImageCaption,
            'published_at' => $this->publishedAt,
            'meta' => $this->meta,
            'topic_id' => $this->topicId,
            'tag_slugs' => $this->tagSlugs,
        ];
    }

    private static function normalizeDateTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof DateTimeInterface || is_string($value)) {
            return Carbon::parse($value)->format('Y-m-d H:i:s');
        }

        return null;
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_scalar($value)) {
            return null;
        }

        $string = (string) $value;

        return $string === '' ? null : $string;
    }

    /**
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    private static function normalizeAssociative(array $value): array
    {
        ksort($value);

        foreach ($value as $key => $item) {
            if (is_array($item)) {
                /** @var array<string, mixed> $item */
                $value[$key] = self::normalizeAssociative($item);
            } elseif ($item === '') {
                $value[$key] = null;
            }
        }

        return $value;
    }
}
