<?php

declare(strict_types=1);

namespace Canvas\Database\Factories;

use Canvas\Models\MediaTag;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MediaTag>
 */
class MediaTagFactory extends Factory
{
    protected $model = MediaTag::class;

    public function definition(): array
    {
        $name = Str::headline(fake()->unique()->words(2, true));

        return [
            'id' => (string) Str::uuid(),
            'name' => $name,
            'slug' => MediaTag::slugFor($name).'-'.Str::lower(Str::random(6)),
            'user_id' => User::factory(),
        ];
    }
}
