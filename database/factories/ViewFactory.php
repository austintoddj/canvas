<?php

namespace Canvas\Database\Factories;

use Canvas\Models\View;
use Illuminate\Database\Eloquent\Factories\Factory;

class ViewFactory extends Factory
{
    protected $model = View::class;

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
