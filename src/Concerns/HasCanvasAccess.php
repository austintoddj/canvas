<?php

declare(strict_types=1);

namespace Canvas\Concerns;

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Illuminate\Database\Eloquent\Casts\Attribute;
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

    protected function canvasRole(): Attribute
    {
        return Attribute::get(fn () => $this->canvasUser?->role);
    }

    protected function isContributor(): Attribute
    {
        return Attribute::get(fn () => $this->canvasRole === Role::Contributor);
    }

    protected function isEditor(): Attribute
    {
        return Attribute::get(fn () => $this->canvasRole === Role::Editor);
    }

    protected function isAdmin(): Attribute
    {
        return Attribute::get(fn () => $this->canvasRole === Role::Admin);
    }

    protected function darkMode(): Attribute
    {
        return Attribute::get(fn () => (bool) ($this->canvasUser?->dark_mode ?? false));
    }

    protected function digest(): Attribute
    {
        return Attribute::get(fn () => (bool) ($this->canvasUser?->digest ?? false));
    }
}
