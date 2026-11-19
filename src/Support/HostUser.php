<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;

final class HostUser
{
    /**
     * @return class-string<Model>
     */
    public static function modelClass(): string
    {
        return config('canvas.user_model');
    }

    public static function name(?Model $user): ?string
    {
        if ($user === null) {
            return null;
        }

        $attribute = $user->hasGetMutator('canvas_name') || $user->hasAttributeGetMutator('canvas_name')
            ? 'canvas_name'
            : 'name';
        $name = $user->getAttributeValue($attribute);

        return is_scalar($name) ? (string) $name : null;
    }

    public static function findByIdentifier(int|string $value): ?Model
    {
        $userModel = self::modelClass();
        $identifier = (string) $value;

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return $userModel::query()->where('email', $identifier)->first();
        }

        return $userModel::query()->find($value);
    }

    public static function findByIdentifierOrFail(int|string $value): Model
    {
        $user = self::findByIdentifier($value);

        if ($user === null) {
            throw (new ModelNotFoundException)->setModel(self::modelClass(), [$value]);
        }

        return $user;
    }
}
