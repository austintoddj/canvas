<?php

namespace Canvas\Database\Factories;

use Canvas\Models\Tag;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TagFactory extends Factory
{
    protected $model = Tag::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'slug' => fake()->slug(),
            'name' => Str::headline(fake()->words(2, true)),
            'user_id' => User::factory(),
        ];
    }
}
