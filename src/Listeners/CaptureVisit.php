<?php

namespace Canvas\Listeners;

use Canvas\Events\PostViewed;
use Canvas\Models\Post;
use Canvas\Support\Referer;

class CaptureVisit
{
    /**
     * A visit is captured when a user loads a post for the first time in a given
     * day. The post ID and the IP of the request are both stored in session to
     * be validated against until pruned by the Session middleware class.
     */
    public function handle(PostViewed $event): void
    {
        $ip = request()->getClientIp();

        if ($this->visitIsUnique($event->post, $ip)) {
            $data = [
                'post_id' => $event->post->id,
                'ip' => $ip,
                'agent' => request()->header('user_agent'),
                'referer' => Referer::host(request()->header('referer')),
            ];

            $event->post->visits()->create($data);

            $this->storeInSession($event->post, $ip);
        }
    }

    /**
     * Check if a given post and IP are unique to the session.
     */
    private function visitIsUnique(Post $post, string $ip): bool
    {
        $visits = session()->get('visited_posts', []);

        if (array_key_exists($post->id, $visits)) {
            $visit = $visits[$post->id];

            return $visit['ip'] != $ip;
        } else {
            return true;
        }
    }

    /**
     * Add a given post and IP to the session.
     */
    private function storeInSession(Post $post, string $ip): void
    {
        session()->put("visited_posts.{$post->id}", [
            'timestamp' => now()->timestamp,
            'ip' => $ip,
        ]);
    }
}
