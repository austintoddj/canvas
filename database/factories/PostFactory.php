<?php

namespace Canvas\Database\Factories;

use Canvas\Models\Post;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'slug' => fake()->slug(),
            'title' => Str::headline(fake()->words(3, true)),
            'summary' => fake()->sentence(),
            'body' => fake()->paragraphs(3, true),
            'published_at' => now()->subDay(),
            'featured_image' => fake()->imageUrl(),
            'featured_image_caption' => fake()->sentence(),
            'user_id' => User::factory(),
            'meta' => [
                'title' => fake()->sentence(),
                'description' => fake()->sentence(),
                'canonical_link' => fake()->url(),
            ],
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['published_at' => null]);
    }

    public function scheduled(): static
    {
        return $this->state(fn () => ['published_at' => now()->addWeek()]);
    }
}
