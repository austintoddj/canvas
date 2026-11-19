<?php

declare(strict_types=1);

namespace Canvas\Concerns;

use Astrotomic\Translatable\Translatable;
use Canvas\Models\PostTranslation;
use Canvas\Support\ContentLocales;
use Canvas\Support\PostBody;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use InvalidArgumentException;

trait HasTranslatedContent
{
    use Translatable;

    /** @var list<string> */
    public $translatedAttributes = ['title', 'summary', 'body', 'meta', 'published_at', 'published_notified_at', 'pending'];

    protected ?string $contentLocale = null;

    protected bool $publicContent = false;

    public function getTranslationModelName(): string
    {
        return PostTranslation::class;
    }

    public function getTranslationRelationKey(): string
    {
        return 'post_id';
    }

    public function getLocaleKey(): string
    {
        return 'locale';
    }

    protected function getFallbackLocale(?string $locale = null): ?string
    {
        return ContentLocales::default();
    }

    protected function useFallback(): bool
    {
        return ContentLocales::enabled() && (bool) config('canvas.content.fallback', true);
    }

    protected function usePropertyFallback(): bool
    {
        return false;
    }

    public function isTranslationAttribute(string $key): bool
    {
        return ContentLocales::enabled() && in_array($key, $this->translatedAttributes, true);
    }

    protected function locale(): string
    {
        return $this->contentLocale ?? $this->getDefaultLocale() ?? ContentLocales::resolve();
    }

    public function contentLocale(): string
    {
        return $this->locale();
    }

    public function inLocale(string $locale, bool $public = false): static
    {
        if (! in_array($locale, ContentLocales::all(), true)) {
            throw new InvalidArgumentException('Unsupported Canvas content locale.');
        }
        $this->contentLocale = $locale;
        $this->publicContent = $public;

        return $this;
    }

    public function getTranslation(?string $locale = null, ?bool $withFallback = null): ?Model
    {
        $translations = $this->publicContent
            ? $this->translations->filter(fn (PostTranslation $translation) => $translation->published_at !== null && ! $translation->published_at->isFuture())
            : $this->translations;
        $translation = $translations->firstWhere('locale', $locale ?? $this->locale());
        if ($withFallback && $translation === null) {
            return $translations->firstWhere('locale', ContentLocales::default());
        }

        return $translation;
    }

    public function fill(array $attributes)
    {
        if (ContentLocales::enabled()) {
            foreach (ContentLocales::all() as $locale) {
                if (isset($attributes[$locale]) && is_array($attributes[$locale])) {
                    $this->getTranslationOrNew($locale)->fill(Arr::only($attributes[$locale], $this->translatedAttributes));
                    unset($attributes[$locale]);
                }
            }
        }

        return parent::fill($attributes);
    }

    public function getAttribute($key)
    {
        if (ContentLocales::enabled() && $this->isTranslationAttribute($key)) {
            if ($this->publicContent && in_array($key, ['pending', 'published_notified_at'], true)) {
                return null;
            }
            $value = $this->getTranslation()?->getAttribute($key);

            return $key === 'pending' && is_array($value) ? PostBody::cleanPending($value) : $value;
        }

        return parent::getAttribute($key);
    }

    public function setAttribute($key, $value)
    {
        if (ContentLocales::enabled() && $this->isTranslationAttribute($key)) {
            if ($key === 'pending' && is_array($value)) {
                $value = PostBody::cleanPending($value);
            }
            $this->getTranslationOrNew()->setAttribute($key, $value);

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    public function save(array $options = [])
    {
        if (! ContentLocales::enabled()) {
            return parent::save($options);
        }

        return $this->getConnection()->transaction(function () use ($options): bool {
            $primary = $this->getTranslation(ContentLocales::default());
            if ($primary !== null) {
                foreach ($this->translatedAttributes as $field) {
                    if (! $this->exists || ! $primary->exists || $primary->isDirty($field)) {
                        parent::setAttribute($field, $primary->getAttribute($field));
                    }
                }
            }
            // Quiet saves skip Astrotomic's saved listener, including publication markers.
            if ($this->usesTimestamps()) {
                $this->setUpdatedAt($this->freshTimestamp());
            }
            $saved = parent::save($options);

            return $saved && $this->saveTranslations();
        });
    }

    public function attributesToArray()
    {
        $attributes = parent::attributesToArray();
        if (! ContentLocales::enabled()) {
            return $attributes;
        }
        foreach ($this->translatedAttributes as $field) {
            if (! in_array($field, $this->getHidden(), true)) {
                $value = $this->getAttribute($field);
                $attributes[$field] = $value instanceof \DateTimeInterface ? $this->serializeDate($value) : $value;
            }
        }
        $attributes['locale'] = $this->locale();
        if ($this->publicContent) {
            unset($attributes['pending'], $attributes['has_pending_changes']);
        }

        return $attributes;
    }

    /** @return array<string, mixed> */
    public function relationsToArray()
    {
        $relations = parent::relationsToArray();
        if (! ContentLocales::enabled()) {
            return $relations;
        }
        // Loaded translation relations must never serialize other languages or drafts.
        unset($relations['translations'], $relations['translation'], $relations['revisions']);

        return $relations;
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForLocale(Builder $query, string $locale, bool $public = true): Builder
    {
        if (! ContentLocales::enabled()) {
            return $query;
        }
        if (! in_array($locale, ContentLocales::all(), true)) {
            throw new InvalidArgumentException('Unsupported Canvas content locale.');
        }
        $locales = $public && config('canvas.content.fallback', true)
            ? array_unique([$locale, ContentLocales::default()]) : [$locale];

        return $query->with(['translations' => function ($translations) use ($locales, $public): void {
            $translations->whereIn('locale', $locales);
            if ($public) {
                $translations->where('published_at', '<=', now());
            }
        }])->afterQuery(function ($posts) use ($locale, $public): void {
            foreach ($posts as $post) {
                if (! $post instanceof self) {
                    continue;
                }
                $resolved = $locale;
                $requested = $post->translations->firstWhere('locale', $locale);
                if ($public && config('canvas.content.fallback', true) && ($requested === null || $requested->published_at === null || $requested->published_at->isFuture())) {
                    $resolved = ContentLocales::default();
                }
                $post->inLocale($resolved, $public);
            }
        });
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopePublishedAny(Builder $query): Builder
    {
        if (! ContentLocales::enabled()) {
            return $query->published();
        }

        return $query->whereHas('translations', fn ($q) => $q->whereIn('locale', ContentLocales::all())->where('published_at', '<=', now()))->withAnyTranslation('published');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeWithAnyTranslation(Builder $query, ?string $status = null): Builder
    {
        if (! ContentLocales::enabled()) {
            return $query;
        }

        return $query->with('translations')->afterQuery(function ($posts) use ($status): void {
            foreach ($posts as $post) {
                if (! $post instanceof self) {
                    continue;
                }
                $translations = $post->translations->filter(function ($translation) use ($status): bool {
                    if (! in_array($translation->locale, ContentLocales::all(), true)) {
                        return false;
                    }

                    return match ($status) {
                        'published' => $translation->published_at !== null && ! $translation->published_at->isFuture(),
                        'draft' => $translation->published_at === null,
                        'scheduled' => $translation->published_at?->isFuture() === true,
                        'pending' => $translation->pending !== null,
                        default => true,
                    };
                });
                $translation = $translations->firstWhere('locale', ContentLocales::default()) ?? $translations->first();
                $post->inLocale($translation !== null ? $translation->locale : ContentLocales::default(), $status === 'published');
            }
        });
    }

    /** @return array<string, string> */
    public function translationStatuses(): array
    {
        $translations = PostTranslation::on($this->getConnectionName())->where('post_id', $this->getKey())->get(['locale', 'published_at'])->keyBy('locale');
        $statuses = [];
        foreach (ContentLocales::all() as $locale) {
            $translation = $translations->get($locale);
            $statuses[$locale] = $translation === null ? 'missing'
                : ($translation->published_at === null ? 'draft' : ($translation->published_at->isFuture() ? 'scheduled' : 'published'));
        }

        return $statuses;
    }
}
