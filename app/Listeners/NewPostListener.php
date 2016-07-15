<?php

namespace App\Listeners;

use App\Events\NewPost;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class NewPostListener
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }


    /**
     * Dispatch plugins
     * @param NewPost $newPost
     */
    public function handle(NewPost $newPost)
    {
        foreach(glob(app_path('Plugins') .'/*.php') as $plugin) {
            $class = "App\\Plugins\\" . basename($plugin, '.php');

            if(in_array('App\Plugins\Interfaces\PostInterface', class_implements($class))) {
                $plugin = new $class;
                $plugin->process($newPost->post);
            }
        }
    }
}
