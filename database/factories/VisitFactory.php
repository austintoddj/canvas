<?php

namespace Canvas\Database\Factories;

use Canvas\Models\Visit;
use Illuminate\Database\Eloquent\Factories\Factory;

class VisitFactory extends Factory
{
    protected $model = Visit::class;

    public function definition(): array
    {
        return [
            'post_id' => null,
            'ip' => fake()->ipv4(),
            'agent' => fake()->userAgent(),
            'referer' => fake()->url(),
        ];
    }
}
