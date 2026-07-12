<?php

declare(strict_types=1);

namespace Canvas\Console\Concerns;

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Support\HostUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

trait ResolvesCanvasUsers
{
    protected function userModel(): string
    {
        return HostUser::modelClass();
    }

    protected function resolveUser(int|string $value): Model
    {
        return HostUser::findByIdentifierOrFail($value);
    }

    protected function resolveRole(string $value): ?Role
    {
        return collect(Role::cases())
            ->first(fn (Role $role) => Str::lower($role->name) === Str::lower($value));
    }

    protected function currentRole(Model $user): ?Role
    {
        return CanvasUser::query()->firstWhere('user_id', $user->getKey())?->role;
    }

    protected function assignRole(Model $user, Role $role): CanvasUser
    {
        return CanvasUser::query()->updateOrCreate(
            ['user_id' => $user->getKey()],
            ['role' => $role],
        );
    }

    protected function removeAccess(Model $user): void
    {
        CanvasUser::query()->where('user_id', $user->getKey())->delete();
    }
}
