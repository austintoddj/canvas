<?php

use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Canvas\Models\Media;
use Canvas\Models\Post;
use Canvas\Policies\UserPolicy;
use Canvas\Support\HostUser;
use Canvas\Support\MediaUploader;
use Canvas\Support\PostAuthor;
use Canvas\Tests\Models\BareUser;
use Canvas\Tests\Models\CustomNameUser;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;

// Invariant: display names are optional and accessor detection never relies on a column.
it('resolves legacy names without an accessor and ignores a canvas_name column', function (): void {
    $user = new BareUser(['name' => 'Legacy Writer', 'canvas_name' => 'Unrelated column']);

    expect(HostUser::name($user))->toBe('Legacy Writer')
        ->and(HostUser::name(new BareUser(['name' => null])))->toBeNull()
        ->and(HostUser::name(new BareUser))->toBeNull()
        ->and(HostUser::name(null))->toBeNull();
});

it('handles missing legacy names with missing attribute protection enabled', function (): void {
    $user = new BareUser;
    $user->exists = true;
    Model::preventAccessingMissingAttributes();

    try {
        expect(HostUser::name($user))->toBeNull();
        $user->name = null;
        expect(HostUser::name($user))->toBeNull();
    } finally {
        Model::preventAccessingMissingAttributes(false);
    }
});

it('supports modern accessors and preserves null accessor results', function (): void {
    $user = new class extends BareUser
    {
        protected function canvasName(): Attribute
        {
            return Attribute::get(fn () => $this->getAttributeValue('display_name'));
        }
    };
    $user->name = 'Legacy Writer';
    $user->display_name = 'Modern Writer';

    expect(HostUser::name($user))->toBe('Modern Writer');
    $user->display_name = null;
    expect(HostUser::name($user))->toBeNull();
});

// Invariant: custom schemas work through eager loads and expose only explicit API fields.
it('uses a custom author accessor throughout the API without a name column', function (): void {
    $admin = $this->admin;
    Schema::table('users', function (Blueprint $table): void {
        $table->renameColumn('name', 'first_name');
        $table->string('last_name')->nullable();
        $table->string('private_note')->nullable();
    });
    config()->set('canvas.user_model', CustomNameUser::class);
    Gate::policy(CustomNameUser::class, UserPolicy::class);

    $user = CustomNameUser::query()->create([
        'first_name' => 'Ada',
        'last_name' => 'Lovelace',
        'email' => 'ada@example.com',
        'password' => 'test-only-password',
        'remember_token' => 'test-only-token',
        'private_note' => 'test-only-private-note',
    ]);
    CanvasUser::factory()->create(['user_id' => $user->getKey(), 'username' => 'ada']);
    $post = Post::factory()->create(['user_id' => $user->getKey()]);
    $post->load('user');

    expect($post->user)->toBeInstanceOf(CustomNameUser::class)
        ->and($post->user->getAttributes())->not->toHaveKey('name')
        ->and(HostUser::name($post->user))->toBe('Ada Lovelace');

    $author = PostAuthor::for($post);
    expect(array_keys($author))->toBe(['id', 'name', 'username', 'avatar_url'])
        ->and($author['name'])->toBe('Ada Lovelace')
        ->and(PostAuthor::forUserId($user->getKey())['name'])->toBe('Ada Lovelace')
        ->and(PostAuthor::mapByUserIds([$user->getKey()])[$user->getKey()]['name'])->toBe('Ada Lovelace')
        ->and(MediaUploader::for(new Media(['user_id' => $user->getKey()]))['name'])->toBe('Ada Lovelace');

    $this->actingAs($admin, 'canvas');
    $responses = [
        $this->getJson('canvas/api/users')->assertSuccessful()->assertJsonFragment(['name' => 'Ada Lovelace']),
        $this->getJson("canvas/api/users/{$user->getKey()}")->assertSuccessful()->assertJsonPath('name', 'Ada Lovelace'),
        $this->getJson('canvas/api/users/lookup?q=ada@example.com')->assertSuccessful()->assertJsonPath('name', 'Ada Lovelace'),
        $this->getJson('canvas/api/search?type=user&q=LOVELACE')->assertSuccessful()->assertJsonCount(1)->assertJsonPath('0.name', 'Ada Lovelace'),
        $this->getJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertJsonPath('post.user.name', 'Ada Lovelace'),
    ];

    foreach ($responses as $response) {
        expect($response->getContent())->not->toContain('test-only-password', 'test-only-token', 'test-only-private-note', 'first_name', 'last_name', 'canvas_name');
    }

    $payload = UserResource::make($user)->resolve();
    expect(array_keys($payload))->toBe(['id', 'name', 'email', 'avatar_url']);
});
