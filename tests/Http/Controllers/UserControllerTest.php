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

    public function testStoreNewUser(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Name',
            'email' => 'email@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'user',
                 'i18n',
             ])
             ->assertFragment([
                 'id' => $data['id'],
                 'name' => $data['name'],
                 'email' => $data['email'],
             ]);
    }

    public function testADeletedUserCanBeRefreshed(): void
    {
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

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertFragment([
                 'id' => $deletedUser->id,
                 'name' => $deletedUser->name,
                 'email' => $deletedUser->email,
             ]);
    }

    public function testUpdateExistingUser(): void
    {
        $user = factory(User::class)->create();

        $data = [
            'name' => 'New name',
            'email' => 'new-email@example.com',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$user->id}", $data)
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertFragment([
                 'id' => $user->id,
                 'name' => $data['name'],
                 'email' => $data['email'],
             ]);
    }

    public function testInvalidPasswordCombinationsAreValidated(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Name',
            'email' => 'email@example.com',
            'password' => 'password',
            'password_confirmation' => 'not-a-match',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertStatus(422)
             ->decodeResponseJson()
             ->assertStructure([
                 'errors' => [
                     'password',
                 ],
             ]);
    }

    public function testShortPasswordsAreValidated(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'Name',
            'email' => 'email@example.com',
            'password' => 'pass',
            'password_confirmation' => 'pass',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$data['id']}", $data)
             ->assertStatus(422)
             ->decodeResponseJson()
             ->assertStructure([
                 'errors' => [
                     'password',
                 ],
             ]);
    }

    public function testDuplicateUsernamesAreValidated(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$this->admin->id}", [
                 'name' => $this->admin->name,
                 'email' => $this->admin->email,
                 'username' => $this->editor->username,
             ])
             ->assertStatus(422)
             ->decodeResponseJson()
             ->assertStructure([
                 'errors' => [
                     'username',
                 ],
             ]);
    }

    public function testDuplicateEmailsAreValidated(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$this->admin->id}", [
                 'name' => $this->admin->name,
                 'email' => $this->editor->email,
             ])
             ->assertStatus(422)
             ->decodeResponseJson()
             ->assertStructure([
                 'errors' => [
                     'email',
                 ],
             ]);
    }

    public function testInvalidEmailsAreValidated(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/users/{$this->admin->id}", [
                 'name' => $this->admin->name,
                 'email' => 'not-an-email',
             ])
             ->assertStatus(422)
             ->decodeResponseJson()
             ->assertStructure([
                 'errors' => [
                     'email',
                 ],
             ]);
    }

    public function testAUserCannotDeleteTheirOwnAccount(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/users/{$this->admin->id}")
             ->assertForbidden();
    }

    public function testDeleteExistingUser(): void
    {
        $user = factory(User::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson('canvas/api/users/not-a-user')
             ->assertNotFound();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/users/{$user->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_users', [
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }
}
