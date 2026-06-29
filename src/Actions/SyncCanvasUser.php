<?php

declare(strict_types=1);

namespace Canvas\Actions;

use Canvas\Data\UserPreferences;
use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Support\CanvasUserAttributes;
use Illuminate\Support\Arr;

final readonly class SyncCanvasUser
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function __invoke(string $userId, array $data, bool $currentUserIsAdmin): bool
    {
        $canvasUser = CanvasUser::find($userId);

        $roleValue = $currentUserIsAdmin && Arr::has($data, 'role') && $data['role'] !== null
            ? Role::from((int) $data['role'])
            : null;

        $attributes = Arr::only($data, CanvasUserAttributes::columns());

        foreach ([...CanvasUserAttributes::UI, ...CanvasUserAttributes::NOTIFICATIONS] as $booleanColumn) {
            if (Arr::has($attributes, $booleanColumn)) {
                $attributes[$booleanColumn] = (bool) $attributes[$booleanColumn];
            }
        }

        if (Arr::has($attributes, 'social')) {
            $attributes['social'] = $this->normalizeSocial($attributes['social']);
        }

        if (Arr::has($data, 'preferences')) {
            $attributes['preferences'] = UserPreferences::merge(
                $canvasUser?->preferences,
                $data['preferences'],
            );
        }

        if (! $canvasUser) {
            if ($roleValue === null) {
                return false;
            }

            CanvasUser::create([
                'user_id' => $userId,
                'role' => $roleValue,
                'dark_mode' => (bool) ($attributes['dark_mode'] ?? false),
                'digest' => (bool) ($attributes['digest'] ?? false),
                'locale' => $attributes['locale'] ?? config('app.fallback_locale'),
                'timezone' => $attributes['timezone'] ?? config('app.timezone'),
                'username' => $attributes['username'] ?? null,
                'summary' => $attributes['summary'] ?? null,
                'avatar' => $attributes['avatar'] ?? null,
                'website' => $attributes['website'] ?? null,
                'social' => $attributes['social'] ?? null,
                'preferences' => $attributes['preferences'] ?? null,
            ]);

            return true;
        }

        if ($roleValue !== null) {
            $attributes['role'] = $roleValue;
        }

        if (! empty($attributes)) {
            $canvasUser->update($attributes);
        }

        return false;
    }

    /**
     * @return array<string, string>|null
     */
    private function normalizeSocial(mixed $social): ?array
    {
        if (! is_array($social)) {
            return null;
        }

        $links = collect($social)
            ->filter(static fn (mixed $value): bool => is_string($value) && $value !== '')
            ->all();

        return $links === [] ? null : $links;
    }
}
