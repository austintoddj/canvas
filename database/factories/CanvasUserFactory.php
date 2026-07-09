<?php

declare(strict_types=1);

namespace Canvas\Database\Factories;

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CanvasUserFactory extends Factory
{
    protected $model = CanvasUser::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'role' => fake()->randomElement(Role::cases()),
            'username' => Str::slug(fake()->unique()->userName()),
            'summary' => fake()->sentence(),
            'avatar' => md5(fake()->unique()->safeEmail()),
            'website' => fake()->optional()->url(),
            'social' => [
                'twitter' => Str::slug(fake()->userName()),
            ],
            'locale' => 'en',
            'timezone' => 'UTC',
            'theme' => null,
            'digest' => true,
            'preferences' => null,
        ];
    }

    public function contributor(): static
    {
        return $this->state(fn () => ['role' => Role::Contributor]);
    }

    public function editor(): static
    {
        return $this->state(fn () => ['role' => Role::Editor]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => Role::Admin]);
    }
}
