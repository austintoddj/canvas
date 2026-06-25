<?php

use Canvas\Models\CanvasUser;
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
it('contributors cannot create a new user', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->postJson('canvas/api/users/'.Uuid::uuid4()->toString(), [
            'name' => 'New User',
            'email' => 'new@example.com',
        ])
        ->assertForbidden();
});
it('editors cannot create a new user', function (): void {
    $this->actingAs($this->editor, 'canvas')
        ->postJson('canvas/api/users/'.Uuid::uuid4()->toString(), [
            'name' => 'New User',
            'email' => 'new@example.com',
        ])
        ->assertForbidden();
});
it('contributors cannot update another users profile', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/users/{$this->editor->id}", [
            'name' => 'Hacked Name',
            'email' => $this->editor->email,
        ])
        ->assertForbidden();
});
it('editors cannot update another users profile', function (): void {
    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/users/{$this->contributor->id}", [
            'name' => 'Hacked Name',
            'email' => $this->contributor->email,
        ])
        ->assertForbidden();
});
it('contributors can update their own profile', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/users/{$this->contributor->id}", [
            'name' => 'Updated Name',
            'email' => $this->contributor->email,
        ])
        ->assertSuccessful()
        ->assertJsonFragment(['name' => 'Updated Name']);
});
it('contributors cannot change their own role', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/users/{$this->contributor->id}", [
            'name' => $this->contributor->name,
            'email' => $this->contributor->email,
            'role' => 3,
        ])
        ->assertSuccessful();

    $this->contributor->refresh();

    $this->assertFalse($this->contributor->isAdmin);
});
it('saves dark mode preference to canvas_users', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/users/{$this->contributor->id}", [
            'name' => $this->contributor->name,
            'email' => $this->contributor->email,
            'dark_mode' => true,
        ])
        ->assertSuccessful();

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $this->contributor->id,
    ]);

    $canvasUser = CanvasUser::find($this->contributor->id);
    $this->assertTrue($canvasUser->dark_mode);
});
it('saves digest preference to canvas_users', function (): void {
    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/users/{$this->editor->id}", [
            'name' => $this->editor->name,
            'email' => $this->editor->email,
            'digest' => false,
        ])
        ->assertSuccessful();

    $canvasUser = CanvasUser::find($this->editor->id);
    $this->assertFalse($canvasUser->digest);
});
it('admin can assign a role via the controller', function (): void {
    $user = User::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'role' => 3,
        ])
        ->assertSuccessful();

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'role' => 3,
    ]);

    $this->assertTrue($user->fresh()->isAdmin);
});
it('does not store canvas fields on the host user model', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/users/{$this->contributor->id}", [
            'name' => $this->contributor->name,
            'email' => $this->contributor->email,
            'dark_mode' => true,
            'digest' => false,
        ])
        ->assertSuccessful();

    $fresh = $this->contributor->fresh();

    $this->assertArrayNotHasKey('dark_mode', $fresh->getAttributes());
    $this->assertArrayNotHasKey('digest', $fresh->getAttributes());
});
