<?php

namespace Canvas\Listeners;

use Canvas\Post;
use Canvas\Events\PostViewed;

class IncrementViewCount
{
    /**
     * Handle the event.
     *
     * @param PostViewed $event
     * @return void
     */
    public function handle(PostViewed $event)
    {
        if (! $this->recentlyViewed($event->post)) {
            $event->post->increment('views');
            $this->storeInSession($event->post);
        }
    }

    /**
     * Check if a given post exists in the session.
     *
     * @param Post $post
     * @return bool
     */
    private function recentlyViewed(Post $post): bool
    {
        $viewed = session()->get('viewed_posts', []);

        return array_key_exists($post->id, $viewed);
    }

    /**
     * Add the post ID into the session.
     *
     * @param Post $post
     * @return void
     */
    private function storeInSession(Post $post)
    {
        $key = 'viewed_posts.'.$post->id;
        session()->put($key, time());
    }
}
