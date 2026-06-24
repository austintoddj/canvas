<?php

declare(strict_types=1);

namespace Canvas\Concerns;

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

trait HasCanvasAccess
{
    public function canvasUser(): HasOne
    {
        return $this->hasOne(CanvasUser::class, 'user_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class, 'user_id');
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class, 'user_id');
    }

    public function getCanvasRoleAttribute(): ?Role
    {
        return $this->canvasUser?->role;
    }

    public function getIsContributorAttribute(): bool
    {
        return $this->canvasRole === Role::Contributor;
    }

    public function getIsEditorAttribute(): bool
    {
        return $this->canvasRole === Role::Editor;
    }

    public function getIsAdminAttribute(): bool
    {
        return $this->canvasRole === Role::Admin;
    }

    public function getDarkModeAttribute(): bool
    {
        return (bool) ($this->canvasUser?->preferences['dark_mode'] ?? false);
    }

    public function getDigestAttribute(): bool
    {
        return (bool) ($this->canvasUser?->preferences['digest'] ?? false);
    }
}
