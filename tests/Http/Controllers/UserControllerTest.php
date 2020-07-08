<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Admin;
use Canvas\Http\Middleware\Session;
use Canvas\Models\UserMeta;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserControllerTest extends TestCase
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
            Admin::class,
            Session::class,
            VerifyCsrfToken::class,
        ]);
    }

    /** @test */
    public function it_can_fetch_all_users()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->getJson('canvas/api/users')->assertSuccessful();

        $this->assertIsArray($response->decodeResponseJson('data'));
        $this->assertEquals(1, $response->decodeResponseJson('total'));
        $this->assertSame($user->id, $response->decodeResponseJson('data.0.id'));
    }

    /** @test */
    public function it_can_fetch_an_existing_user_with_meta_data()
    {
        $meta = factory(UserMeta::class)->create();

        $response = $this->actingAs($meta->user)->getJson("canvas/api/users/{$meta->user->id}")->assertSuccessful();

        $this->assertIsArray($response->decodeResponseJson('user'));
        $this->assertSame($meta->user->id, $response->decodeResponseJson('user.id'));
        $this->assertSame($meta->user->name, $response->decodeResponseJson('user.name'));
        $this->assertSame($meta->user->email, $response->decodeResponseJson('user.email'));

        $this->assertIsArray($response->decodeResponseJson('meta'));
        $this->assertEquals($meta->user->id, $response->decodeResponseJson('meta.user_id'));
        $this->assertEquals($meta->avatar, $response->decodeResponseJson('meta.avatar'));
        $this->assertSame($meta->username, $response->decodeResponseJson('meta.username'));
        $this->assertSame($meta->summary, $response->decodeResponseJson('meta.summary'));
        $this->assertSame($meta->dark_mode, $response->decodeResponseJson('meta.dark_mode'));
        $this->assertSame($meta->locale, $response->decodeResponseJson('meta.locale'));
        $this->assertEquals($meta->admin, $response->decodeResponseJson('meta.admin'));
        $this->assertSame($meta->digest, $response->decodeResponseJson('meta.digest'));
    }

    /** @test */
    public function it_can_store_user_meta_data()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->postJson("canvas/api/users/{$user->id}", [
            'user_id' => $user->id,
        ])->assertSuccessful();

        $this->assertArrayHasKey('avatar', $response->decodeResponseJson());
        $this->assertArrayHasKey('dark_mode', $response->decodeResponseJson());
        $this->assertArrayHasKey('digest', $response->decodeResponseJson());
        $this->assertArrayHasKey('summary', $response->decodeResponseJson());
        $this->assertArrayHasKey('locale', $response->decodeResponseJson());
        $this->assertArrayHasKey('username', $response->decodeResponseJson());

        $this->assertEquals($user->id, $response->decodeResponseJson('user_id'));
    }

    /** @test */
    public function it_can_update_user_meta_data()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->postJson("canvas/api/users/{$user->id}", [
            'user_id' => $user->id,
        ])->assertSuccessful();

        $this->assertArrayHasKey('avatar', $response->decodeResponseJson());
        $this->assertArrayHasKey('dark_mode', $response->decodeResponseJson());
        $this->assertArrayHasKey('digest', $response->decodeResponseJson());
        $this->assertArrayHasKey('summary', $response->decodeResponseJson());
        $this->assertArrayHasKey('locale', $response->decodeResponseJson());
        $this->assertArrayHasKey('username', $response->decodeResponseJson());

        $this->assertEquals($user->id, $response->decodeResponseJson('user_id'));
    }

    /** @test */
    public function it_verifies_usernames_are_unique_to_a_user()
    {
        $meta = factory(UserMeta::class)->create();

        factory(UserMeta::class)->create([
            'username' => 'an-existing-username',
        ]);

        $response = $this->actingAs($meta->user)->postJson("canvas/api/users/{$meta->user_id}", [
            'user_id' => $meta->user->id,
            'username' => 'an-existing-username',
        ])->assertStatus(422);

        $this->assertArrayHasKey('username', $response->decodeResponseJson('errors'));
    }
}
