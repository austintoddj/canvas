<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class UserControllerTest.
 *
 * @covers \Canvas\Http\Controllers\UserController
 * @covers \Canvas\Http\Requests\UserRequest
 */
class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     * @throws Exception
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->registerAssertJsonExactFragmentMacro();
    }

    public function testAnAdminCanFetchAllUsers(): void
    {
        $response = $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/users')
             ->assertSuccessful()
            ->assertJson([
                'data.0.id' => $this->admin->id,
            ]);

        dd($response['data'][0]['id']);
//             ->assertJsonExactFragment($this->contributor->id, 'data.0.id')
//             ->assertJsonExactFragment($this->editor->id, 'data.1.id')
//             ->assertJsonExactFragment($this->admin->id, 'data.2.id')
//             ->assertJsonExactFragment($user->name, 'data.0.name')
//             ->assertJsonExactFragment($user->email, 'data.0.email')
//             ->assertJsonExactFragment($user->username, 'data.0.username')
//             ->assertJsonExactFragment($user->summary, 'data.0.summary')
//             ->assertJsonExactFragment($user->avatar, 'data.0.avatar')
//             ->assertJsonExactFragment($user->dark_mode, 'data.0.dark_mode')
//             ->assertJsonExactFragment($user->digest, 'data.0.digest')
//             ->assertJsonExactFragment($user->locale, 'data.0.locale')
//             ->assertJsonExactFragment($user->role, 'data.0.role')
//             ->assertJsonExactFragment($user->posts->count(), 'data.0.posts_count')
//             ->assertJsonExactFragment(3, 'total');

//        dd($response->original);
//        $this->assertSame($this->contributor->id, $response->decodeResponseJson('data.0.id'));

//        dd($response->decodeResponseJson('data'), [
//            $this->contributor->id,
//            $this->editor->id,
//            $this->admin->id
//        ]);
    }

    /** @test */
    public function it_can_fetch_a_new_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $response = $this->actingAs($user, 'canvas')->getJson('canvas/api/users/create')->assertSuccessful();

        $this->assertArrayHasKey('id', $response->original);
    }

    /** @test */
    public function it_can_fetch_an_existing_user()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $response = $this->actingAs($user, 'canvas')->getJson("canvas/api/users/{$user->id}")->assertSuccessful();

        $this->assertSame($user->id, $response->original['id']);
        $this->assertSame($user->name, $response->original['name']);
        $this->assertSame($user->email, $response->original['email']);
        $this->assertSame($user->username, $response->original['username']);
        $this->assertSame($user->summary, $response->original['summary']);
        $this->assertSame($user->avatar, $response->original['avatar']);
        $this->assertSame($user->dark_mode, $response->original['dark_mode']);
        $this->assertSame($user->digest, $response->original['digest']);
        $this->assertSame($user->locale, $response->original['locale']);
        $this->assertSame($user->role, $response->original['role']);
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

        $this->assertIsArray($response->original->items());
        $this->assertCount(1, $response->original->items());
        $this->assertArrayHasKey('views_count', $response->original->items()[0]);
        $this->assertEquals(1, $response->original->items()[0]['views_count']);
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
            'password' => 'password',
            'password_confirmation' => 'password',
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
            'email' => 'email@example.com',
            'deleted_at' => now(),
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Deleted User',
            'email' => 'email@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        $this->actingAs($admin, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($deletedUser->name, 'user.name')
             ->assertJsonExactFragment($deletedUser->email, 'user.email')
             ->assertJsonExactFragment($deletedUser->id, 'user.id');
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
            'email' => 'email@example.com',
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
    public function it_validates_incorrect_password_confirmation()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Name',
            'email' => 'email@example.com',
            'password' => 'password',
            'password_confirmation' => 'not-a-match',
        ];

        $response = $this->actingAs($user, 'canvas')
                         ->postJson("canvas/api/users/{$data['id']}", $data);

        $this->assertArrayHasKey('password', $response->original['errors']);
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
                             'email' => $user->email,
                             'username' => $contributor->username,
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('username', $response->original['errors']);
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

        $this->assertArrayHasKey('email', $response->original['errors']);
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

        $this->assertArrayHasKey('email', $response->original['errors']);
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
