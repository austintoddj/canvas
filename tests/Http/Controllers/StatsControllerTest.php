<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Role;
use Canvas\Models\UserMeta;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class StatsControllerTest.
 *
 * @covers \Canvas\Http\Controllers\StatsController
 */
class StatsControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            Authorize::class,
            Session::class,
            VerifyCsrfToken::class,
        ]);

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function it_can_fetch_stats_for_user_posts()
    {
        $user = factory(config('canvas.user'))->create();

        factory(Post::class, 3)->create([
            'user_id' => $user->id,
        ]);

        factory(Post::class, 1)->create([
            'user_id' => 2,
        ]);

        $response = $this->actingAs($user)->getJson('canvas/api/stats')->assertSuccessful();

        $this->assertArrayHasKey('posts', $response->decodeResponseJson());
        $this->assertCount(3, $response->decodeResponseJson('posts'));

        $this->assertArrayHasKey('totalViews', $response->decodeResponseJson());
        $this->assertEquals(0, $response->decodeResponseJson('totalViews'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('totalVisits', $response->decodeResponseJson());
        $this->assertEquals(0, $response->decodeResponseJson('totalVisits'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function it_can_fetch_stats_for_all_posts()
    {
        $user = factory(config('canvas.user'))->create();

        factory(Post::class, 3)->create([
            'user_id' => $user->id,
        ]);

        factory(Post::class, 1)->create([
            'user_id' => 2,
        ]);

        $response = $this->actingAs($user)->getJson('canvas/api/stats?scope=all')->assertSuccessful();

        $this->assertArrayHasKey('posts', $response->decodeResponseJson());
        $this->assertCount(4, $response->decodeResponseJson('posts'));

        $this->assertArrayHasKey('totalViews', $response->decodeResponseJson());
        $this->assertEquals(0, $response->decodeResponseJson('totalViews'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('totalVisits', $response->decodeResponseJson());
        $this->assertEquals(0, $response->decodeResponseJson('totalVisits'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function it_can_show_stats_for_another_users_published_post_as_an_admin()
    {
        $admin = factory(UserMeta::class)->create([
            'role_id' => Role::ADMIN,
        ]);

        $post = factory(Post::class)->create([
            'user_id' => 123,
        ]);

        $response = $this->actingAs($admin->user)
                         ->getJson("canvas/api/stats/{$post->id}")
                         ->assertSuccessful()
                         ->assertJsonExactFragment($post->id, 'post.id');

        $this->assertArrayHasKey('post', $response->decodeResponseJson());

        $this->assertArrayHasKey('readTime', $response->decodeResponseJson());

        $this->assertArrayHasKey('popularReadingTimes', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('popularReadingTimes'));

        $this->assertArrayHasKey('topReferers', $response);
        $this->assertIsArray($response->decodeResponseJson('topReferers'));

        $this->assertArrayHasKey('monthlyViews', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthlyViews'));
        $this->assertEquals(0, $response->decodeResponseJson('monthlyViews'));

        $this->assertArrayHasKey('monthlyVisits', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthlyVisits'));
        $this->assertEquals(0, $response->decodeResponseJson('monthlyVisits'));

        $this->assertArrayHasKey('totalViews', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('totalViews'));
        $this->assertEquals(0, $response->decodeResponseJson('totalViews'));

        $this->assertArrayHasKey('monthOverMonthViews', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('monthOverMonthViews'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('monthOverMonthViews'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthViews.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('monthOverMonthViews'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthViews.percentage'));

        $this->assertArrayHasKey('monthOverMonthVisits', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthVisits.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthVisits.percentage'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function it_can_show_stats_for_another_users_published_post_as_an_editor()
    {
        $editor = factory(UserMeta::class)->create([
            'role_id' => Role::EDITOR,
        ]);

        $post = factory(Post::class)->create([
            'user_id' => 123,
        ]);

        $response = $this->actingAs($editor->user)
                         ->getJson("canvas/api/stats/{$post->id}")
                         ->assertSuccessful()
                         ->assertJsonExactFragment($post->id, 'post.id');

        $this->assertArrayHasKey('post', $response->decodeResponseJson());

        $this->assertArrayHasKey('readTime', $response->decodeResponseJson());

        $this->assertArrayHasKey('popularReadingTimes', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('popularReadingTimes'));

        $this->assertArrayHasKey('topReferers', $response);
        $this->assertIsArray($response->decodeResponseJson('topReferers'));

        $this->assertArrayHasKey('monthlyViews', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthlyViews'));
        $this->assertEquals(0, $response->decodeResponseJson('monthlyViews'));

        $this->assertArrayHasKey('monthlyVisits', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthlyVisits'));
        $this->assertEquals(0, $response->decodeResponseJson('monthlyVisits'));

        $this->assertArrayHasKey('totalViews', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('totalViews'));
        $this->assertEquals(0, $response->decodeResponseJson('totalViews'));

        $this->assertArrayHasKey('monthOverMonthViews', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('monthOverMonthViews'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('monthOverMonthViews'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthViews.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('monthOverMonthViews'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthViews.percentage'));

        $this->assertArrayHasKey('monthOverMonthVisits', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthVisits.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthVisits.percentage'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function it_can_show_stats_for_a_users_published_post_as_a_contributor()
    {
        $contributor = factory(UserMeta::class)->create([
            'role_id' => Role::CONTRIBUTOR,
        ]);

        $post = factory(Post::class)->create([
            'user_id' => $contributor->user->id,
        ]);

        $response = $this->actingAs($contributor->user)
                         ->getJson("canvas/api/stats/{$post->id}")
                         ->assertSuccessful()
                         ->assertJsonExactFragment($post->id, 'post.id');

        $this->assertArrayHasKey('post', $response->decodeResponseJson());

        $this->assertArrayHasKey('readTime', $response->decodeResponseJson());

        $this->assertArrayHasKey('popularReadingTimes', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('popularReadingTimes'));

        $this->assertArrayHasKey('topReferers', $response);
        $this->assertIsArray($response->decodeResponseJson('topReferers'));

        $this->assertArrayHasKey('monthlyViews', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthlyViews'));
        $this->assertEquals(0, $response->decodeResponseJson('monthlyViews'));

        $this->assertArrayHasKey('monthlyVisits', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('monthlyVisits'));
        $this->assertEquals(0, $response->decodeResponseJson('monthlyVisits'));

        $this->assertArrayHasKey('totalViews', $response->decodeResponseJson());
        $this->assertIsInt($response->decodeResponseJson('totalViews'));
        $this->assertEquals(0, $response->decodeResponseJson('totalViews'));

        $this->assertArrayHasKey('monthOverMonthViews', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('monthOverMonthViews'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('monthOverMonthViews'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthViews.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('monthOverMonthViews'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthViews.percentage'));

        $this->assertArrayHasKey('monthOverMonthVisits', $response->decodeResponseJson());
        $this->assertIsArray($response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertArrayHasKey('direction', $response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthVisits.direction'));
        $this->assertArrayHasKey('percentage', $response->decodeResponseJson('monthOverMonthVisits'));
        $this->assertIsString($response->decodeResponseJson('monthOverMonthVisits.percentage'));

        $this->assertArrayHasKey('views', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.views'));

        $this->assertArrayHasKey('visits', $response->decodeResponseJson('traffic'));
        $this->assertJson($response->decodeResponseJson('traffic.visits'));
    }

    /** @test */
    public function it_returns_404_if_post_is_not_published()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->addWeek(),
        ]);

        $this->actingAs($post->user)->getJson("canvas/api/stats/{$post->id}")->assertNotFound();
    }

    /** @test */
    public function it_returns_404_if_no_post_is_found()
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->getJson('canvas/api/stats/not-a-post')->assertNotFound();
    }
}
