<?php

/* @var \Illuminate\Database\Eloquent\Factory $factory */
$factory->define(\Illuminate\Foundation\Auth\User::class, function (Faker\Generator $faker) {
    return [
        'name' => $faker->name,
        'email' => $faker->safeEmail,
        'password' => bcrypt($faker->password),
    ];
});
