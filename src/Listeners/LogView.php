<?php

namespace Canvas\Listeners;

use Canvas\Post;
use Canvas\Events\PostViewed;

class LogView
{
    /**
     * Handle the event.
     *
     * @param PostViewed $event
     * @return void
     */
    public function handle(PostViewed $event)
    {
        if (! $this->wasRecentlyViewed($event->post)) {
            $view_data = [
                'post_id'    => $event->post->id,
                'user_agent' => request()->header('user_agent'),
                'referer'    => request()->header('referer'),
            ];

            $event->post->views()->create($view_data);

            $this->storeInSession($event->post);
        }
    }

    /**
     * Check if a given post exists in the session.
     *
     * @param Post $post
     * @return bool
     */
    private function wasRecentlyViewed(Post $post): bool
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
