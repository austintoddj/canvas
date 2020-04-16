<?php

namespace Canvas\Tests\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Tests\TestCase;
use Canvas\Topic;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TopicControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function display_a_listing_of_the_resource()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();
        $topic = factory(Topic::class)->create([
            'user_id' => $user_1->id,
            'name' => 'A New Hope',
            'slug' => 'a-new-hope',
        ]);

        $this->actingAs($user_1)
             ->get('canvas/api/topics')
             ->assertSuccessful()
             ->assertJsonExactFragment($topic->id, 'data.0.id')
             ->assertJsonExactFragment($topic->name, 'data.0.name')
             ->assertJsonExactFragment($user_1->id, 'data.0.user_id')
             ->assertJsonExactFragment($topic->slug, 'data.0.slug')
             ->assertJsonExactFragment($topic->posts->count(), 'data.0.posts_count')
             ->assertJsonExactFragment(1, 'total');

        $this->actingAs($user_2)
             ->get('canvas/api/topics')
             ->assertSuccessful()
             ->assertJsonExactFragment(0, 'total');
    }

    /** @test */
    public function display_the_specified_resource()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user_1->id,
            'name' => 'Empire Strikes Back',
            'slug' => 'empire-strikes-back',
        ]);

        $response = $this->actingAs($user_1)
                         ->get('canvas/api/topics/create')
                         ->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson());

        $this->actingAs($user_1)
             ->get("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertJsonExactFragment($topic->id, 'id')
             ->assertJsonExactFragment($topic->name, 'name')
             ->assertJsonExactFragment($user_1->id, 'user_id')
             ->assertJsonExactFragment($topic->slug, 'slug');

        $this->actingAs($user_1)
             ->get('canvas/api/topics/not-a-topic')
             ->assertNotFound();

        $this->actingAs($user_2)
             ->get("canvas/api/topics/{$topic->id}")
             ->assertNotFound();
    }

    /** @test */
    public function store_a_newly_created_resource_in_storage()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $data = [
            'name' => 'Return of the Jedi',
            'slug' => 'return-of-the-jedi',
        ];

        $this->actingAs($user_1)
             ->post('canvas/api/topics/create', $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($user_1->id, 'user_id');
    }

    /** @test */
    public function remove_the_specified_resource_from_storage()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user_1->id,
            'name' => 'The Clone Wars',
            'slug' => 'the-clone-wars',
        ]);

        $this->actingAs($user_2)
             ->delete("canvas/api/topics/{$topic->id}")
             ->assertNotFound();

        $this->actingAs($user_1)
             ->delete("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertNoContent();
    }
}
