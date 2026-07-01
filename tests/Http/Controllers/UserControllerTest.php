<?php

use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Tests\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Uuid\Uuid;

describe('when listing users', function (): void {
    it('lists users with canvas access', function (): void {
        $this->seedDefaultCanvasUsers();

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/users')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'name',
                    'email',
                    'avatar_url',
                    'posts_count',
                    'canvas' => [
                        'role',
                        'username',
                        'locale',
                        'avatar_url',
                        'preferences',
                    ],
                ]],
            ]);
    });

    it('does not list host users without canvas access', function (): void {
        $this->seedDefaultCanvasUsers();

        User::factory()->create();

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/users')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data');
    });

    it('returns default canvas profile data for creating access', function (): void {
        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/users/create')
            ->assertSuccessful();

        expect($response->json('canvas'))->toMatchArray([
            'locale' => config('app.fallback_locale'),
            'timezone' => config('app.timezone'),
            'theme' => 'system',
            'digest' => false,
            'preferences' => [
                'onboarding' => [
                    'complete' => false,
                ],
            ],
        ]);
    });

    it('returns existing user data', function (): void {
        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/users/{$this->contributor->id}")
            ->assertSuccessful()
            ->assertJsonPath('id', $this->contributor->id)
            ->assertJsonPath('email', $this->contributor->email)
            ->assertJsonPath('canvas.role', 1);
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
        $this->actingAsAdmin()
            ->getJson('canvas/api/users/not-a-user')
            ->assertNotFound();
    });
});

describe('when granting and updating access', function (): void {
    it('grants canvas access to an existing host user', function (): void {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/users/{$user->id}", [
                'role' => 1,
                'summary' => 'Writer bio',
            ])
            ->assertCreated();

        $response->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.canvas.role', 1)
            ->assertJsonPath('user.canvas.summary', 'Writer bio');

        $this->assertDatabaseHas('canvas_users', [
            'user_id' => $user->id,
            'role' => 1,
            'summary' => 'Writer bio',
        ]);
    });

    it('returns not found when storing profile for a missing host user', function (): void {
        $this->actingAs($this->admin, 'canvas')
            ->postJson('canvas/api/users/'.Uuid::uuid4()->toString(), [
                'role' => 1,
            ])
            ->assertNotFound();
    });

    it('updates an existing canvas profile', function (): void {
        $user = User::factory()->contributor()->create();

        $response = $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/users/{$user->id}", [
                'summary' => 'Updated bio',
                'username' => 'updated-user',
            ])
            ->assertSuccessful()
            ->assertJsonPath('user.canvas.summary', 'Updated bio')
            ->assertJsonPath('user.canvas.username', 'updated-user');

        $this->assertDatabaseHas('canvas_users', [
            'user_id' => $user->id,
            'summary' => 'Updated bio',
            'username' => 'updated-user',
        ]);
    });

    it('does not modify the host user record when saving a canvas profile', function (): void {
        $user = User::factory()->contributor()->create();
        $originalName = $user->name;
        $originalEmail = $user->email;

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/users/{$user->id}", [
                'summary' => 'Only Canvas data',
                'username' => 'canvas-only',
            ])
            ->assertSuccessful();

        $fresh = $user->fresh();

        expect($fresh->name)->toBe($originalName);
        expect($fresh->email)->toBe($originalEmail);
        expect($fresh->getAttributes())->not->toHaveKey('summary');
        expect($fresh->getAttributes())->not->toHaveKey('username');
    });

    it('duplicate usernames are validated against canvas_users', function (): void {
        $this->actingAsAdmin()
            ->postJson("canvas/api/users/{$this->admin->id}", [
                'username' => $this->editor->username,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);
    });
});

describe('when revoking access', function (): void {
    // Regression: GH-779 — users cannot revoke their own canvas access
    it('users cannot revoke their own canvas access', function (): void {
        $this->actingAsAdmin()
            ->deleteJson("canvas/api/users/{$this->admin->id}")
            ->assertForbidden();
    });

    it('returns not found when revoking access for unknown users', function (): void {
        $this->actingAs($this->admin, 'canvas')
            ->deleteJson('canvas/api/users/not-a-user')
            ->assertNotFound();
    });

    it('revokes canvas access without deleting the host user', function (): void {
        $user = User::factory()->contributor()->create();

        $this->actingAs($this->admin, 'canvas')
            ->deleteJson("canvas/api/users/{$user->id}")
            ->assertSuccessful()
            ->assertNoContent();

        $this->assertDatabaseMissing('canvas_users', [
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => $user->email,
        ]);
    });
});

describe('when enforcing role authorization', function (): void {
    it('contributors cannot grant canvas access to another user', function (): void {
        $user = User::factory()->create();

        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$user->id}", [
                'role' => 1,
            ])
            ->assertForbidden();
    });

    it('editors cannot grant canvas access to another user', function (): void {
        $user = User::factory()->create();

        $this->actingAs($this->editor, 'canvas')
            ->postJson("canvas/api/users/{$user->id}", [
                'role' => 1,
            ])
            ->assertForbidden();
    });

    it('contributors cannot update another users canvas profile', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->editor->id}", [
                'summary' => 'Hacked bio',
            ])
            ->assertForbidden();
    });

    it('editors cannot update another users canvas profile', function (): void {
        $this->actingAs($this->editor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'summary' => 'Hacked bio',
            ])
            ->assertForbidden();
    });

    it('contributors can update their own canvas profile', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'summary' => 'Updated bio',
            ])
            ->assertSuccessful()
            ->assertJsonPath('user.canvas.summary', 'Updated bio');
    });

    it('contributors cannot change their own role', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'role' => 3,
            ])
            ->assertSuccessful();

        $this->contributor->refresh();

        $this->assertFalse($this->contributor->isAdmin);
    });
});

describe('when saving preferences', function (): void {
    it('saves theme preference to canvas_users', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'theme' => 'dark',
            ])
            ->assertSuccessful();

        $this->assertDatabaseHas('canvas_users', [
            'user_id' => $this->contributor->id,
            'theme' => 'dark',
        ]);
    });

    it('saves digest preference to canvas_users', function (): void {
        $this->actingAs($this->editor, 'canvas')
            ->postJson("canvas/api/users/{$this->editor->id}", [
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
                'role' => 3,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('canvas_users', [
            'user_id' => $user->id,
            'role' => 3,
        ]);

        $this->assertTrue($user->fresh()->isAdmin);
    });

    it('saves website, social, timezone, and preferences to canvas_users', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'website' => 'https://example.com',
                'social' => [
                    'twitter' => 'writer',
                ],
                'timezone' => 'America/Chicago',
                'preferences' => [
                    'onboarding' => [
                        'complete' => true,
                    ],
                ],
            ])
            ->assertSuccessful();

        $canvasUser = CanvasUser::find($this->contributor->id);

        expect($canvasUser->website)->toBe('https://example.com');
        expect($canvasUser->social)->toBe(['twitter' => 'writer']);
        expect($canvasUser->timezone)->toBe('America/Chicago');
        expect($canvasUser->preferences)->toBe([
            'onboarding' => [
                'complete' => true,
            ],
        ]);
    });
});

describe('when validating profiles', function (): void {
    it('rejects invalid websites', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'website' => 'not-a-url',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['website']);
    });

    it('rejects invalid timezones', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'timezone' => 'Not/A_Timezone',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['timezone']);
    });

    it('rejects unsupported locales', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'locale' => 'zz',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['locale']);
    });

    it('rejects invalid roles', function (): void {
        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/users/{$this->admin->id}", [
                'role' => 99,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);
    });

    it('rejects non-array social links', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'social' => 'twitter',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['social']);
    });
});

describe('when isolating host user data', function (): void {
    it('does not store canvas fields on the host user model', function (): void {
        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/users/{$this->contributor->id}", [
                'theme' => 'light',
                'digest' => false,
                'summary' => 'Bio',
                'username' => 'writer',
                'locale' => 'en',
            ])
            ->assertSuccessful();

        $fresh = $this->contributor->fresh();

        $this->assertArrayNotHasKey('theme', $fresh->getAttributes());
        $this->assertArrayNotHasKey('digest', $fresh->getAttributes());
        $this->assertArrayNotHasKey('summary', $fresh->getAttributes());
        $this->assertArrayNotHasKey('username', $fresh->getAttributes());
        $this->assertArrayNotHasKey('locale', $fresh->getAttributes());
    });
});
