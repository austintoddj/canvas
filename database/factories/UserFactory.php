<?php

namespace Canvas\Database\Factories;

use Canvas\Models\CanvasUser;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function contributor(): static
    {
        return $this->afterCreating(function (User $user): void {
            CanvasUser::factory()->contributor()->create([
                'user_id' => $user->id,
            ]);
        });
    }

    public function editor(): static
    {
        return $this->afterCreating(function (User $user): void {
            CanvasUser::factory()->editor()->create([
                'user_id' => $user->id,
            ]);
        });
    }

    public function admin(): static
    {
        return $this->afterCreating(function (User $user): void {
            CanvasUser::factory()->admin()->create([
                'user_id' => $user->id,
            ]);
        });
    }
}
