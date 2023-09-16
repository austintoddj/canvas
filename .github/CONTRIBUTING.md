# Contributing Guide

Thank you for considering contributing to Canvas! One of the ongoing goals for Canvas is to make it as accessible as possible. If you come across any translation mistakes or issues and want to make a contribution, please [create a pull request](https://github.com/austintoddj/canvas/pulls). If you don't see your native language included in the `lang` directory, feel free to add it.

-   [OS Tools](#before-you-get-started)
-   [Setup](#setup)
    -   [Git](#git)
    -   [Database](#database)
    -   [Directories](#directories)
    -   [Installation](#installation)
    -   [Developing](#developing)

## Before you get started

-   Make sure the [Vue DevTools](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd?hl=en) extension is installed in your Chrome browser
-   Add the following function from [Caleb Porzio](https://calebporzio.com/bash-alias-composer-link-use-local-folders-as-composer-dependancies/) to your `~/.bashrc`, `~/.bash_profile` or `~/.zshrc`:

```bash
composer-link() {composer config repositories.local '{"type": "path", "url": "'$1'"}' --file composer.json}
```

## Setup

You can open a completely prebuilt, ready-to-code development environment using Gitpod.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/austintoddj/canvas/tree/master)

Alternatively, see instructions below to manually setting up an environment on your own machine.

### Git

Fork the project on [https://github.com/austintoddj/canvas](https://github.com/austintoddj/canvas) to your own account. Then clone the fork with the following command:

```bash
git clone https://github.com/your-account/canvas.git
```

In an adjacent directory from where you cloned the repo, create a new Laravel project with the following command:

```bash
composer create-project --prefer-dist laravel/laravel blog
```

### Database

The fastest way to get a database up and running is to issue the following command:

```bash
touch database/database.sqlite
```

Now update your `.env` file to reflect the new database:

```php
DB_CONNECTION=sqlite
```

### Directories

From your Laravel app, link the local version of Canvas using the `composer-link()` function:

```bash
composer-link ../canvas/
composer require austintoddj/canvas @dev
```

### Installation

Now that the projects are linked, run the following installation steps:

```bash
# Install the Canvas package
php artisan canvas:install

# Link the storage directory
php artisan storage:link
```

Statistics are a core component to the app, so it's best to have a large dataset in place when developing. To
generate some, add the following factories to your Laravel app:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CanvasVisitFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = \Canvas\Models\Visit::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'post_id' => \Canvas\Models\Post::all()->pluck('id')->random(),
            'ip' => $this->faker->ipv4,
            'agent' => $this->faker->userAgent,
            'referer' => $this->faker->url,
            'created_at' => today()->subDays(rand(0, 60))->toDateTimeString(),
            'updated_at' => today()->subDays(rand(0, 60))->toDateTimeString(),
        ];
    }
}
```

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CanvasViewFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = \Canvas\Models\View::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'post_id' => \Canvas\Models\Post::all()->pluck('id')->random(),
            'ip' => $this->faker->ipv4,
            'agent' => $this->faker->userAgent,
            'referer' => $this->faker->url,
            'created_at' => today()->subDays(rand(0, 60))->toDateTimeString(),
            'updated_at' => today()->subDays(rand(0, 60))->toDateTimeString(),
        ];
    }
}

```

In the `run()` method of the `DatabaseSeeder`:

```php
\Database\Factories\CanvasViewFactory::new()->count(850)->create();
\Database\Factories\CanvasVisitFactory::new()->count(500)->create();
```

You can now run `php artisan db:seed` and you will have a substantial amount of views for each post.

### Developing

Instead of making and compiling frontend changes in the package, then having to re-publish the assets in the
Laravel app again and again, we can utilize a symlink:

```bash
# remove the existing assets from the Laravel app
rm -rf public/vendor/canvas/*

# go inside the empty directory and create a symlink
cd public/vendor/canvas
ln -s ../../../../canvas/public/* .
```

Once you've made your changes, [create a pull request](https://github.com/austintoddj/canvas/compare) from your fork to the `develop` branch of the project repository.
