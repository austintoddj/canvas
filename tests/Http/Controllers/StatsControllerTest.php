<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StatsControllerTest extends TestCase
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
    public function stats_can_be_listed()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->getJson('canvas/api/stats')->assertSuccessful();

        $this->assertArrayHasKey('total_views', $response->decodeResponseJson());
        $this->assertEquals(0, $response->decodeResponseJson('total_views'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('total_visits', $response->decodeResponseJson());
        $this->assertEquals(0, $response->decodeResponseJson('total_visits'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function stats_can_be_fetched()
    {
        $post = factory(Post::class)->create();

        $this->actingAs($post->user)->getJson('canvas/api/stats/not-a-post')->assertNotFound();

        $response = $this->actingAs($post->user)
                         ->getJson("canvas/api/stats/{$post->id}")
                         ->assertSuccessful()
                         ->assertJsonExactFragment($post->id, 'post.id');

        $this->assertArrayHasKey('post', $response->decodeResponseJson());

        $this->assertArrayHasKey('read_time', $response->decodeResponseJson());

        $this->assertArrayHasKey('popular_reading_times', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('popular_reading_times'));

        $this->assertArrayHasKey('top_referers', $response);
        $this->assertIsArray($response->decodeResponseJson('top_referers'));

        $this->assertArrayHasKey('monthly_views', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthly_views'));
        $this->assertEquals(0, $response->decodeResponseJson('monthly_views'));

        $this->assertArrayHasKey('monthly_visits', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthly_visits'));
        $this->assertEquals(0, $response->decodeResponseJson('monthly_visits'));

        $this->assertArrayHasKey('total_views', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('total_views'));
        $this->assertEquals(0, $response->decodeResponseJson('total_views'));

        $this->assertArrayHasKey('month_over_month_views', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('month_over_month_views'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('month_over_month_views'));
        $this->assertIsString($response->decodeResponseJson('month_over_month_views.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('month_over_month_views'));
        $this->assertIsString($response->decodeResponseJson('month_over_month_views.percentage'));

        $this->assertArrayHasKey('month_over_month_visits', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('month_over_month_visits'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('month_over_month_visits'));
        $this->assertIsString($response->decodeResponseJson('month_over_month_visits.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('month_over_month_visits'));
        $this->assertIsString($response->decodeResponseJson('month_over_month_visits.percentage'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function it_returns_404_if_no_post_is_found()
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->getJson('canvas/api/stats/not-a-post')->assertNotFound();
    }

    /** @test */
    public function it_returns_404_if_post_is_not_published()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->addWeek(),
        ]);

        $this->actingAs($post->user)->getJson("canvas/api/stats/{$post->id}")->assertNotFound();
    }
}
