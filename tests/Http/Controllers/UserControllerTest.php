<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

/**
 * Class UserControllerTest.
 *
 * @covers \Canvas\Http\Controllers\UserController
 */
class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function it_can_fetch_users()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $this->actingAs($user, 'canvas')
             ->getJson('canvas/api/users')
             ->assertSuccessful()
             ->assertJsonExactFragment($user->id, 'data.0.id')
             ->assertJsonExactFragment($user->name, 'data.0.name')
             ->assertJsonExactFragment($user->email, 'data.0.email')
             ->assertJsonExactFragment($user->username, 'data.0.username')
             ->assertJsonExactFragment($user->summary, 'data.0.summary')
             ->assertJsonExactFragment($user->avatar, 'data.0.avatar')
             ->assertJsonExactFragment($user->dark_mode, 'data.0.dark_mode')
             ->assertJsonExactFragment($user->digest, 'data.0.digest')
             ->assertJsonExactFragment($user->locale, 'data.0.locale')
             ->assertJsonExactFragment($user->role, 'data.0.role')
             ->assertJsonExactFragment($user->posts->count(), 'data.0.posts_count')
             ->assertJsonExactFragment(1, 'total');
    }

    /** @test */
    public function it_can_fetch_a_new_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $response = $this->actingAs($user, 'canvas')->getJson('canvas/api/users/create')->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson());
    }

    /** @test */
    public function it_can_fetch_an_existing_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $response = $this->actingAs($user, 'canvas')->getJson("canvas/api/users/{$user->id}")->assertSuccessful();

        $this->assertSame($user->id, $response->decodeResponseJson('id'));
        $this->assertSame($user->name, $response->decodeResponseJson('name'));
        $this->assertSame($user->email, $response->decodeResponseJson('email'));
        $this->assertSame($user->username, $response->decodeResponseJson('username'));
        $this->assertSame($user->summary, $response->decodeResponseJson('summary'));
        $this->assertSame($user->avatar, $response->decodeResponseJson('avatar'));
        $this->assertSame($user->dark_mode, $response->decodeResponseJson('dark_mode'));
        $this->assertSame($user->digest, $response->decodeResponseJson('digest'));
        $this->assertSame($user->locale, $response->decodeResponseJson('locale'));
        $this->assertSame($user->role, $response->decodeResponseJson('role'));
    }

    /** @test */
    public function it_can_fetch_posts_for_an_existing_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $response = $this->actingAs($user, 'canvas')->getJson("canvas/api/users/{$user->id}/posts")->assertSuccessful();

        $this->assertIsArray($response->decodeResponseJson('data'));
        $this->assertCount(1, $response->decodeResponseJson('data'));
        $this->assertArrayHasKey('views_count', $response->decodeResponseJson('data.0'));
        $this->assertEquals(1, $response->decodeResponseJson('data.0.views_count'));
    }

    /** @test */
    public function it_returns_404_if_no_user_is_found()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $this->actingAs($user, 'canvas')->getJson('canvas/api/users/not-a-user')->assertNotFound();
    }

    /** @test */
    public function it_can_create_a_new_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Name',
            'email' => 'email@example.com',
            'password' => Hash::make(Str::random(60)),
        ];

        $this->actingAs($user, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertSuccessful()
            ->assertJsonExactFragment($data['name'], 'user.name')
            ->assertJsonExactFragment($data['email'], 'user.email')
            ->assertJsonExactFragment($data['id'], 'user.id');
    }

    /** @test */
    public function it_can_refresh_a_deleted_user()
    {
        $admin = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $deletedUser = factory(User::class)->create([
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Deleted User',
            'email'=> 'email@example.com',
            'deleted_at' => now(),
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Deleted User',
            'email'=> 'email@example.com',
            'password' => Hash::make(Str::random(60)),
        ];

        $this->actingAs($admin, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertSuccessful()
            ->assertJsonExactFragment($deletedUser->name, 'name')
            ->assertJsonExactFragment($deletedUser->email, 'email')
            ->assertJsonExactFragment($deletedUser->id, 'id');
    }

    /** @test */
    public function it_can_update_an_existing_user()
    {
        $admin = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $user = factory(User::class)->create([
            'id' => Uuid::uuid4()->toString(),
            'name' => 'User',
            'email'=> 'email@example.com',
            'password' => Hash::make(Str::random(60)),
        ]);

        $data = [
            'name' => 'New name',
            'email' => 'new-email@example.com',
        ];

        $this->actingAs($admin, 'canvas')
             ->postJson("canvas/api/users/{$user->id}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'user.name')
             ->assertJsonExactFragment($data['email'], 'user.email');
    }

    /** @test */
    public function it_will_not_store_a_duplicate_username()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $contributor = factory(User::class)->create([
            'role' => User::CONTRIBUTOR,
        ]);

        $response = $this->actingAs($user, 'canvas')
                         ->postJson("canvas/api/users/{$user->id}", [
                             'name' => $user->name,
                             'username' => $contributor->username,
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('username', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function it_will_not_store_a_duplicate_email()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $contributor = factory(User::class)->create([
            'role' => User::CONTRIBUTOR,
        ]);

        $response = $this->actingAs($user, 'canvas')
                         ->postJson("canvas/api/users/{$user->id}", [
                             'name' => $user->name,
                             'email' => $contributor->email,
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('email', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function it_will_not_store_an_invalid_email()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $response = $this->actingAs($user, 'canvas')
                         ->postJson("canvas/api/users/{$user->id}", [
                             'name' => 'Name',
                             'email' => 'not-an-email',
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('email', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function it_will_not_allow_users_to_delete_themselves()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $this->actingAs($user, 'canvas')
             ->deleteJson("canvas/api/users/{$user->id}")
             ->assertForbidden();
    }

    /** @test */
    public function it_can_delete_a_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $contributor = factory(User::class)->create([
            'role' => User::CONTRIBUTOR,
        ]);

        $this->actingAs($user, 'canvas')
             ->deleteJson("canvas/api/users/{$contributor->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_users', [
            'id' => $contributor->id,
            'email' => $contributor->email,
        ]);
    }
}
