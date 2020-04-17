<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class TopicTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);
    }

    /** @test */
    public function allow_topics_to_share_the_same_slug_with_unique_users()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $topic_1 = $this->actingAs($user_1)->post('/canvas/api/topics/create', [
            'id' => Uuid::uuid4(),
            'name' => 'Return of the Jedi',
            'slug' => 'return-of-the-jedi',
        ]);

        $user_2 = factory(config('canvas.user'))->create();
        $topic_2 = $this->actingAs($user_2)->post('/canvas/api/topics/create', [
            'id' => Uuid::uuid4(),
            'name' => 'Return of the Jedi',
            'slug' => 'return-of-the-jedi',
        ]);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $topic_1->decodeResponseJson('id'),
            'slug' => $topic_1->decodeResponseJson('slug'),
            'user_id' => $topic_1->decodeResponseJson('user_id'),
        ]);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $topic_2->decodeResponseJson('id'),
            'slug' => $topic_2->decodeResponseJson('slug'),
            'user_id' => $topic_2->decodeResponseJson('user_id'),
        ]);
    }
}
