<?php

namespace Canvas\Database\Factories;

use Canvas\Models\Media;
use Canvas\Support\Paths;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        $filename = Str::uuid().'.jpg';

        return [
            'id' => (string) Str::uuid(),
            'path' => Paths::baseStoragePath().'/'.$filename,
            'filename' => $filename,
            'original_name' => fake()->word().'.jpg',
            'mime_type' => 'image/jpeg',
            'size' => fake()->numberBetween(1024, 1048576),
            'width' => fake()->numberBetween(100, 2000),
            'height' => fake()->numberBetween(100, 2000),
            'alt' => fake()->optional()->sentence(),
            'caption' => fake()->optional()->sentence(),
            'user_id' => User::factory(),
        ];
    }
}
