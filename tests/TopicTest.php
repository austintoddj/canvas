<?php

namespace Canvas\Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class TopicTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function allow_topics_to_share_the_same_slug_with_unique_users()
    {
        $user_1 = factory(\Illuminate\Foundation\Auth\User::class)->create();
        $topic_1 = $this->actingAs($user_1)->withoutMiddleware()->post('/canvas/api/topics/create', [
            'id' => Uuid::uuid4(),
            'name' => 'Return of the Jedi',
            'slug' => 'return-of-the-jedi',
        ]);

        $user_2 = factory(\Illuminate\Foundation\Auth\User::class)->create();
        $topic_2 = $this->actingAs($user_2)->withoutMiddleware()->post('/canvas/api/topics/create', [
            'id' => Uuid::uuid4(),
            'name' => 'Return of the Jedi',
            'slug' => 'return-of-the-jedi',
        ]);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $topic_1->decodeResponseJson()['id'],
            'slug' => $topic_1->decodeResponseJson()['slug'],
            'user_id' => $topic_1->decodeResponseJson()['user_id'],
        ]);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $topic_2->decodeResponseJson()['id'],
            'slug' => $topic_2->decodeResponseJson()['slug'],
            'user_id' => $topic_2->decodeResponseJson()['user_id'],
        ]);
    }
}
