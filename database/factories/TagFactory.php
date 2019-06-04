<?php

use Canvas\Tag;
use Illuminate\Support\Str;
use Faker\Generator as Faker;

/* @var \Illuminate\Database\Eloquent\Factory $factory */
$factory->define(Tag::class, function (Faker $faker) {
    $tag = $faker->word;

    return [
        'slug' => Str::slug($tag),
        'name' => $tag,
    ];
});
