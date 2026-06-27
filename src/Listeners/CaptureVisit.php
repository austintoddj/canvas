<?php

declare(strict_types=1);

namespace Canvas\Listeners;

use Canvas\Events\PostViewed;
use Canvas\Models\Post;
use Canvas\Support\BotDetector;
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
        if (BotDetector::isBot($event->agent)) {
            return;
        }

        $ip = $event->ip;

        if ($this->visitIsUnique($event->post, $ip)) {
            $data = [
                'post_id' => $event->post->id,
                'ip' => $ip,
                'agent' => $event->agent,
                'referer' => Referer::host($event->referer),
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

        return ! array_key_exists($post->id, $visits)
            || $visits[$post->id]['ip'] !== $ip;
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
