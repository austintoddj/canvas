<?php

namespace App\Providers;

use App\Events\NewPost;
use App\Models\Post;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Post::saving(function($post) {

           if(!$post->is_draft) { // Need to make this smarter, need a migration for published/bool
               \Event::fire(new NewPost($post));
           }
        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
