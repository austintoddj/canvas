<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Uuid\Uuid;

/**
 * Class UserControllerTest.
 *
 * @covers \Canvas\Http\Controllers\UserController
 */
class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testAllUsersAreFetchedByDefault(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $contributor = User::factory()->contributor()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index'))
            ->assertJsonFragment([
                'id' => $admin->id,
                'id' => $editor->id,
                'id' => $contributor->id,
            ])
            ->assertSuccessful();

        $this->assertInstanceOf(User::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(3, $response->getOriginalContent());
    }

    public function testUsersCanBeSortedByCreationDateWithAGivenQueryParameter(): void
    {
        $admin = User::factory()->admin()->create(['created_at' => now()]);

        $oldUser = User::factory()->create(['created_at' => now()->subDay()]);

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index', ['sort' => 'desc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $admin->id);

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index', ['sort' => 'asc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $oldUser->id);

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index'))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $admin->id);
    }

    public function testAdminsCanBeFetchedWithAGivenQueryParameter(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $contributor = User::factory()->contributor()->create();

        $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index', ['role' => User::$admin_id]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $admin->id,
            ])
            ->assertJsonMissing([
                'id' => $contributor->id,
                'id' => $editor->id,
            ]);
    }

    public function testEditorsCanBeFetchedWithAGivenQueryParameter(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $contributor = User::factory()->contributor()->create();

        $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index', ['role' => User::$editor_id]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $editor->id,
            ])
            ->assertJsonMissing([
                'id' => $admin->id,
                'id' => $contributor->id,
            ]);
    }

    public function testContributorsCanBeFetchedWithAGivenQueryParameter(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $contributor = User::factory()->contributor()->create();

        $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.index', ['role' => User::$contributor_id]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $contributor->id,
            ])
            ->assertJsonMissing([
                'id' => $admin->id,
                'id' => $editor->id,
            ]);
    }

    public function testCreateDataForUser(): void
    {
        $response = $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.users.create'))
            ->assertSuccessful();

        $this->assertInstanceOf(User::class, $response->getOriginalContent());
    }

    public function testExistingUserData(): void
    {
        $admin = User::factory()->admin()->create();

        $contributor = User::factory()->contributor()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.users.show', ['id' => $contributor->id]))
            ->assertSuccessful();

        $this->assertTrue($contributor->is($response->getOriginalContent()));
    }

    public function testListPostsForUser(): void
    {
        $user = User::factory()->admin()->hasPosts(1)->create();

        $response = $this->actingAs($user, 'canvas')
            ->getJson(route('canvas.users.posts', ['id' => $user->id]))
            ->assertSuccessful();

        $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(1, $response->getOriginalContent());
    }

    public function testUserNotFound(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.users.show', ['id' => Uuid::uuid4()->toString()]))
            ->assertNotFound();
    }

    public function testStoreNewUser(): void
    {
        $data = [
            'name' => 'Name',
            'email' => 'email@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        $response = $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->putJson(route('canvas.users.store', ['id' => Uuid::uuid4()->toString()]), $data)
            ->assertJsonStructure([
                'i18n',
                'user',
            ])
            ->assertSuccessful();

        $this->assertInstanceOf(User::class, $response->getOriginalContent()['user']);

        $this->assertJson($response->getOriginalContent()['i18n']);

        $this->assertSame($data['email'], $response->getOriginalContent()['user']->email);
    }

    public function testUpdateExistingUser(): void
    {
        $contributor = User::factory()->contributor()->create();

        $data = [
            'name' => 'New name',
            'email' => 'new-email@example.com',
        ];

        $response = $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $contributor->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $contributor->id,
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

        $this->assertInstanceOf(User::class, $response->getOriginalContent()['user']);

        $this->assertSame($data['email'], $response->getOriginalContent()['user']->email);
    }

    public function testUsersCannotDeleteTheirOwnAccount(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'canvas')
            ->deleteJson(route('canvas.users.destroy', ['id' => $admin]))
            ->assertForbidden();
    }

    public function testDeleteExistingUser(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $this->actingAs($admin, 'canvas')
            ->deleteJson(route('canvas.users.destroy', ['id' => $editor->id]))
            ->assertSuccessful()
            ->assertNoContent();

        $this->assertSoftDeleted('canvas_users', [
            'id' => $editor->id,
            'email' => $editor->email,
        ]);
    }
}
