<?php

use Canvas\Post;
use Illuminate\Support\Str;
use Faker\Generator as Faker;
use Illuminate\Foundation\Auth\User;

/* @var \Illuminate\Database\Eloquent\Factory $factory */
$factory->define(Post::class, function (Faker $faker) {
    $post = $faker->words(3);

    return [
        'slug'         => Str::slug($post),
        'title'        => $post,
        'summary'      => $faker->sentence,
        'body'         => $faker->text,
        'published_at' => now()->toDateTimeString(),
        'user_id'      => User::first()->id,
    ];
});
