<?php

declare(strict_types=1);

namespace Canvas\Concerns;

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Support\Localization;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Optional host-app integration for Canvas.
 *
 * Canvas stores access, roles, and author profile data in `canvas_users`. The
 * package reads that table directly — routes, gates, policies, and API resources
 * do not require this trait.
 *
 * Add it to your host `User` model when you want familiar Laravel ergonomics in
 * your own application code: a `canvasUser` relationship, content ownership
 * relations (`posts`, `tags`, `topics`), and accessors that delegate to the
 * linked `canvas_users` row (`isAdmin`, `username`, `locale`, etc.).
 *
 * Granting access still happens outside this trait — via `canvas:make-admin`,
 * `canvas:assign-role`, or the Canvas admin API — which create the `canvas_users`
 * row this trait reads from.
 */
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

    protected function username(): Attribute
    {
        return Attribute::get(fn () => $this->canvasUser?->username);
    }

    protected function summary(): Attribute
    {
        return Attribute::get(fn () => $this->canvasUser?->summary);
    }

    protected function avatar(): Attribute
    {
        return Attribute::get(fn () => $this->canvasUser?->avatar);
    }

    protected function locale(): Attribute
    {
        return Attribute::get(fn () => Localization::resolveLocale($this->canvasUser?->locale));
    }

    protected function darkMode(): Attribute
    {
        return Attribute::get(fn () => (bool) ($this->canvasUser?->dark_mode ?? false));
    }

    protected function digest(): Attribute
    {
        return Attribute::get(fn () => (bool) ($this->canvasUser?->digest ?? false));
    }

    protected function defaultLocale(): Attribute
    {
        return Attribute::get(fn () => Localization::resolveLocale($this->canvasUser?->locale));
    }
}
