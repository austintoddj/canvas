<?php
/**
 * Created by PhpStorm.
 * User: mphill
 * Date: 7/15/16
 * Time: 3:57 PM
 */

namespace App\Plugins;


use App\Models\Post;
use App\Plugins\Interfaces\PostInterface;

class DummyPostPlugin implements PostInterface
{

    public function getName()
    {
        return 'Dummy Post Plugin';
    }

    public function getVersion()
    {
        return '1.0';
    }

    public function process(Post $post)
    {
        \Log::info("New Post: " . $post->title);
    }
}