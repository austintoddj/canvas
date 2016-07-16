<?php
/**
 * Created by PhpStorm.
 * User: mphill
 * Date: 7/15/16
 * Time: 3:55 PM
 */

namespace App\Plugins\Interfaces;


use App\Models\Post;

interface PostInterface
{
    public function getName();
    public function getVersion();
    public function process(Post $post);
}