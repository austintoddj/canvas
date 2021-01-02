<?php

namespace Canvas\Traits;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Illuminate\Database\Eloquent\Relations\HasMany;

trait User
{
    /**
     * Get the posts relationship.
     *
     * @return HasMany
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the tags relationship.
     *
     * @return HasMany
     */
    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Get the topics relationship.
     *
     * @return HasMany
     */
    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }

    /**
     * Check to see if the user is a Contributor.
     *
     * @return bool
     */
    public function getIsContributorAttribute(): bool
    {
        return $this->role === self::CONTRIBUTOR;
    }

    /**
     * Check to see if the user is an Editor.
     *
     * @return bool
     */
    public function getIsEditorAttribute(): bool
    {
        return $this->role === self::EDITOR;
    }

    /**
     * Check to see if the user is an Admin.
     *
     * @return bool
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->role === self::ADMIN;
    }

    /**
     * Return a default user locale.
     *
     * @return string
     */
    public function getDefaultLocaleAttribute(): string
    {
        return config('app.locale');
    }
}
