<?php

namespace Canvas\Tests\Http\Controllers;

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

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function user_details_can_be_listed()
    {
        // New settings...
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->getJson("canvas/api/users/{$user->id}")->assertSuccessful();

        $this->assertArrayHasKey('avatar', $response->decodeResponseJson());
        $this->assertArrayHasKey('darkMode', $response->decodeResponseJson());
        $this->assertArrayHasKey('digest', $response->decodeResponseJson());
        $this->assertArrayHasKey('summary', $response->decodeResponseJson());
        $this->assertArrayHasKey('locale', $response->decodeResponseJson());
        $this->assertArrayHasKey('username', $response->decodeResponseJson());

        // Existing settings...
        $userMeta = factory(UserMeta::class)->create([
            'dark_mode' => 1,
            'digest' => 0,
            'locale' => 'en',
        ]);

        $response = $this->actingAs($userMeta->user)->getJson("canvas/api/users/{$userMeta->user_id}")->assertSuccessful();

        $this->assertArrayHasKey('avatar', $response->decodeResponseJson());
        $this->assertArrayHasKey('darkMode', $response->decodeResponseJson());
        $this->assertArrayHasKey('digest', $response->decodeResponseJson());
        $this->assertArrayHasKey('summary', $response->decodeResponseJson());
        $this->assertArrayHasKey('locale', $response->decodeResponseJson());
        $this->assertArrayHasKey('username', $response->decodeResponseJson());

        $this->assertEquals($userMeta->dark_mode, $response->decodeResponseJson('darkMode'));
        $this->assertEquals($userMeta->digest, $response->decodeResponseJson('digest'));
        $this->assertEquals($userMeta->locale, $response->decodeResponseJson('locale'));
    }

    /** @test */
    public function user_details_can_be_stored()
    {
        // New settings...
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

        // Existing settings...
        $response = $this->actingAs($user)->postJson("canvas/api/users/{$user->id}", [
            'username' => 'a-new-username',
        ])->assertSuccessful();

        $this->assertArrayHasKey('avatar', $response->decodeResponseJson());
        $this->assertArrayHasKey('dark_mode', $response->decodeResponseJson());
        $this->assertArrayHasKey('digest', $response->decodeResponseJson());
        $this->assertArrayHasKey('summary', $response->decodeResponseJson());
        $this->assertArrayHasKey('locale', $response->decodeResponseJson());
        $this->assertArrayHasKey('username', $response->decodeResponseJson());

        $settings = UserMeta::forUser($user)->first();

        $this->assertEquals($settings->username, $response->decodeResponseJson('username'));
    }

    /** @test */
    public function usernames_are_unique_to_a_user()
    {
        $userMeta = factory(UserMeta::class)->create();

        factory(UserMeta::class)->create([
            'username' => 'an-existing-username',
        ]);

        $response = $this->actingAs($userMeta->user)->postJson("canvas/api/users/{$userMeta->user_id}", [
            'user_id' => $userMeta->user->id,
            'username' => 'an-existing-username',
        ])->assertStatus(422);

        $this->assertArrayHasKey('username', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function it_returns_404_if_users_access_another_user_account()
    {
        $userOne = factory(config('canvas.user'))->create();
        $userTwo = factory(config('canvas.user'))->create();

        $this->actingAs($userTwo)->getJson("canvas/api/users/{$userOne->id}")->assertNotFound();
        $this->actingAs($userOne)->postJson("canvas/api/users/{$userTwo->id}")->assertNotFound();
    }
}
