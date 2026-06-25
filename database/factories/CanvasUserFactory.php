<?php

declare(strict_types=1);

namespace Canvas\Database\Factories;

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Illuminate\Database\Eloquent\Factories\Factory;

class CanvasUserFactory extends Factory
{
    protected $model = CanvasUser::class;

    public function definition(): array
    {
        return [
            'user_id' => fake()->uuid(),
            'role' => fake()->randomElement(Role::cases()),
            'dark_mode' => false,
            'digest' => true,
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
