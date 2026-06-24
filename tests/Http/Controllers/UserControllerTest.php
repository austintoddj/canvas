<?php

use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Tests\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Uuid\Uuid;

it('lists all users', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/users')
        ->assertSuccessful();

    $this->assertInstanceOf(User::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(3, $response->getOriginalContent());
});
it('returns data for creating a user', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/users/create')
        ->assertSuccessful();

    $this->assertInstanceOf(User::class, $response->getOriginalContent());
});
it('returns existing user data', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/users/{$this->contributor->id}")
        ->assertSuccessful();

    $this->assertTrue($this->contributor->is($response->getOriginalContent()));
});
it('lists posts for a user', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    View::factory()->create([
        'post_id' => $post->id,
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/users/{$this->admin->id}/posts")
        ->assertSuccessful();

    $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(1, $response->getOriginalContent());
});
it('returns not found for unknown users', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/users/not-a-user')
        ->assertNotFound();
});
it('stores a new user', function (): void {
    $data = [
        'id' => Uuid::uuid4()->toString(),
        'name' => 'Name',
        'email' => 'email@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$data['id']}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(User::class, $response->getOriginalContent()['user']);

    $this->assertSame($data['id'], $response->getOriginalContent()['user']->id);
});
it('restores deleted users when refreshed', function (): void {
    $deletedUser = User::factory()->create([
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

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$data['id']}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(User::class, $response->getOriginalContent()['user']);

    $this->assertSame($deletedUser['id'], $response->getOriginalContent()['user']->id);
});
it('updates an existing user', function (): void {
    $user = User::factory()->create();

    $data = [
        'name' => 'New name',
        'email' => 'new-email@example.com',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$user->id}", $data)
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $user->id,
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

    $this->assertInstanceOf(User::class, $response->getOriginalContent()['user']);

    $this->assertSame($data['email'], $response->getOriginalContent()['user']->email);
});
it('invalid password combinations are validated', function (): void {
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
        ->assertJsonStructure([
            'errors' => [
                'password',
            ],
        ]);
});
it('short passwords are validated', function (): void {
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
        ->assertJsonStructure([
            'errors' => [
                'password',
            ],
        ]);
});
it('duplicate usernames are validated', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'username' => $this->editor->username,
        ])
        ->assertStatus(422)
        ->assertJsonStructure([
            'errors' => [
                'username',
            ],
        ]);
});
it('duplicate emails are validated', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => $this->editor->email,
        ])
        ->assertStatus(422)
        ->assertJsonStructure([
            'errors' => [
                'email',
            ],
        ]);
});
it('invalid emails are validated', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => 'not-an-email',
        ])
        ->assertStatus(422)
        ->assertJsonStructure([
            'errors' => [
                'email',
            ],
        ]);
});
it('users cannot delete their own account', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/users/{$this->admin->id}")
        ->assertForbidden();
});
it('deletes an existing user', function (): void {
    $user = User::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/users/not-a-user')
        ->assertNotFound();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/users/{$user->id}")
        ->assertSuccessful()
        ->assertNoContent();

    $this->assertSoftDeleted('users', [
        'id' => $user->id,
        'email' => $user->email,
    ]);
});
