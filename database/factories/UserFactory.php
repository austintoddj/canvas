<?php

namespace Canvas\Database\Factories;

use Canvas\Enums\Role;
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
        $email = fake()->unique()->safeEmail();

        return [
            'id' => (string) Str::uuid(),
            'name' => fake()->name(),
            'email' => $email,
            'username' => Str::slug(fake()->unique()->userName()),
            'password' => static::$password ??= Hash::make('password'),
            'summary' => fake()->sentence(),
            'avatar' => md5(trim(Str::lower($email))),
            'dark_mode' => false,
            'digest' => false,
            'locale' => 'en',
            'role' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function contributor(): static
    {
        return $this->afterCreating(function (User $user): void {
            CanvasUser::factory()->create([
                'user_id' => $user->id,
                'role' => Role::Contributor,
            ]);
        });
    }

    public function editor(): static
    {
        return $this->afterCreating(function (User $user): void {
            CanvasUser::factory()->create([
                'user_id' => $user->id,
                'role' => Role::Editor,
            ]);
        });
    }

    public function admin(): static
    {
        return $this->afterCreating(function (User $user): void {
            CanvasUser::factory()->create([
                'user_id' => $user->id,
                'role' => Role::Admin,
            ]);
        });
    }
}
