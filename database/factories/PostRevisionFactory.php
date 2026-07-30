<?php

namespace Canvas\Database\Factories;

use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PostRevision>
 */
class PostRevisionFactory extends Factory
{
    protected $model = PostRevision::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::orderedUuid(),
            'post_id' => Post::factory(),
            'user_id' => null,
            'label' => null,
            'title' => Str::headline(fake()->words(3, true)),
            'slug' => fake()->slug(),
            'summary' => fake()->sentence(),
            'body' => fake()->paragraphs(2, true),
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ];
    }
}
