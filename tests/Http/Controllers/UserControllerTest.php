<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
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

    public function testAnAdminCanFetchAllUsers(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/users')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertFragment([
                 'id' => $this->admin->id,
                 'role' => User::ADMIN,
                 'posts_count' => (string) $this->admin->posts()->count(),
                 'default_avatar' => $this->admin->default_avatar,
                 'default_locale' => $this->admin->default_locale,
             ])
             ->assertFragment([
                 'id' => $this->editor->id,
                 'role' => User::EDITOR,
                 'posts_count' => (string) $this->editor->posts()->count(),
                 'default_avatar' => $this->editor->default_avatar,
                 'default_locale' => $this->editor->default_locale,
             ])
             ->assertFragment([
                 'id' => $this->contributor->id,
                 'role' => User::CONTRIBUTOR,
                 'posts_count' => (string) $this->contributor->posts()->count(),
                 'default_avatar' => $this->contributor->default_avatar,
                 'default_locale' => $this->contributor->default_locale,
             ]);
    }

    public function testNewPostData(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/users/create')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'id',
                 'default_avatar',
             ])
             ->assertFragment([
                 'role' => User::CONTRIBUTOR,
                 'default_locale' => config('app.locale'),

             ]);
    }

    public function testExistingPostData(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/users/{$this->contributor->id}")
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertFragment([
                 'id' => $this->contributor->id,
                 'role' => User::CONTRIBUTOR,
                 'posts_count' => (string) $this->contributor->posts()->count(),
                 'default_avatar' => $this->contributor->default_avatar,
                 'default_locale' => $this->contributor->default_locale,
             ]);
    }

    public function testPostsCanBeFetchedForAUser(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/users/{$this->admin->id}/posts")
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertFragment([
                 'id' => $post->id,
                 'views_count' => (string) $post->views->count(),
                 'total' => $this->admin->posts()->count(),
             ]);
    }

    public function testUserNotFound(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/users/not-a-user')
             ->assertNotFound();
    }

    /** @test */
    public function it_can_create_a_new_user()
    {
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
        $this->markTestSkipped();

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
