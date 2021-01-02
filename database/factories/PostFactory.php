<?php

/* @var \Illuminate\Database\Eloquent\Factory $factory */
$factory->define(\Canvas\Models\Post::class, function (Faker\Generator $faker) {
    return [
        'id' => $faker->uuid,
        'slug' => $faker->slug,
        'title' => $faker->word,
        'summary' => $faker->sentence,
        'body' => $faker->realText(),
        'published_at' => today()->toDateTimeString(),
        'featured_image' => $faker->imageUrl(),
        'featured_image_caption' => $faker->sentence,
        'user_id' => function () {
            return factory(\App\Models\User::class)->create()->id;
        },
        'meta' => [
            'title' => $faker->sentence,
            'description' => $faker->sentence,
            'canonical_link' => $faker->sentence,
        ],
    ];
});
