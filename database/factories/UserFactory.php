<?php

/* @var \Illuminate\Database\Eloquent\Factory $factory */

use Illuminate\Support\Str;

$factory->define(\App\Models\User::class, function (Faker\Generator $faker) {
    return [
        'id' => $faker->uuid,
        'name' => $faker->name,
        'email' => $faker->safeEmail,
        'username' => Str::slug($faker->userName),
        'password' => bcrypt($faker->password),
        'summary' => $faker->sentence,
        'avatar' => md5(trim(Str::lower($faker->email))),
        'dark_mode' => $faker->numberBetween(0, 1),
        'digest' => $faker->numberBetween(0, 1),
        'locale' => $faker->locale,
        'role' => $faker->numberBetween(1, 3),
    ];
});
