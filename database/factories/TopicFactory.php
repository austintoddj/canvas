<?php

use Canvas\Topic;
use Illuminate\Support\Str;
use Faker\Generator as Faker;

/* @var \Illuminate\Database\Eloquent\Factory $factory */
$factory->define(Topic::class, function (Faker $faker) {
    $topic = $faker->word;

    return [
        'slug' => Str::slug($topic),
        'name' => $topic,
    ];
});
