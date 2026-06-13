<?php

namespace Canvas\Database\Factories;

use Canvas\Models\User;
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
            'role' => fake()->numberBetween(User::CONTRIBUTOR, User::ADMIN),
            'remember_token' => Str::random(10),
        ];
    }

    public function contributor(): static
    {
        return $this->state(fn () => ['role' => User::CONTRIBUTOR]);
    }

    public function editor(): static
    {
        return $this->state(fn () => ['role' => User::EDITOR]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => User::ADMIN]);
    }

    public function digestEnabled(): static
    {
        return $this->state(fn () => ['digest' => true]);
    }

    public function digestDisabled(): static
    {
        return $this->state(fn () => ['digest' => false]);
    }
}
