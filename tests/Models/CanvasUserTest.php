<?php

use Canvas\Data\UserPreferences;
use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Tests\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

it('stores the role and theme preference columns', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Admin,
        'theme' => 'dark',
        'digest' => false,
    ]);

    expect($canvasUser->role)->toBe(Role::Admin);
    expect($canvasUser->theme)->toBe('dark');
    expect($canvasUser->digest)->toBeFalse();
});

it('stores profile columns on canvas_users', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
        'username' => 'writer',
        'summary' => 'Bio',
        'avatar' => 'https://cdn.example.com/avatar.jpg',
        'website' => 'https://example.com',
        'social' => [
            'x' => 'writer',
        ],
        'locale' => 'en',
        'timezone' => 'America/Chicago',
    ]);

    expect($canvasUser->username)->toBe('writer');
    expect($canvasUser->summary)->toBe('Bio');
    expect($canvasUser->avatar)->toBe('https://cdn.example.com/avatar.jpg');
    expect($canvasUser->website)->toBe('https://example.com');
    expect($canvasUser->social)->toBe([
        'x' => 'writer',
    ]);
    expect($canvasUser->locale)->toBe('en');
    expect($canvasUser->timezone)->toBe('America/Chicago');
});

it('casts social and preferences as arrays', function (): void {
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => User::factory()->create()->id,
        'social' => [
            'github' => 'canvas',
        ],
        'preferences' => [
            'example' => [
                'enabled' => true,
            ],
        ],
    ]);

    expect($canvasUser->social)->toBeArray();
    expect($canvasUser->preferences)->toBeArray();
});

it('returns an empty social links array when social is null', function (): void {
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => User::factory()->create()->id,
        'social' => null,
    ]);

    expect($canvasUser->social)->toBeNull();
    expect($canvasUser->socialLinks())->toBe([]);
});

it('resolves preferences against package defaults', function (): void {
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => User::factory()->create()->id,
        'preferences' => null,
    ]);

    expect($canvasUser->resolvedPreferences())->toBe(UserPreferences::defaults());
});

it('belongs to the host user model', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($canvasUser->user())->toBeInstanceOf(BelongsTo::class);
    expect($canvasUser->user)->toBeInstanceOf(User::class);
});

it('counts authored posts through user_id', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
    ]);

    Post::factory()->count(2)->create(['user_id' => $user->id]);

    $counted = CanvasUser::query()
        ->withPostsCount()
        ->find($canvasUser->user_id);

    expect($counted->posts_count)->toBe(2);
});

it('resolves roles from canvas_users without trait accessors', function (): void {
    $admin = User::factory()->admin()->create();
    $contributor = User::factory()->contributor()->create();

    expect(CanvasUser::isAdmin($admin))->toBeTrue();
    expect(CanvasUser::isContributor($contributor))->toBeTrue();
    expect(CanvasUser::roleFor($contributor))->toBe(Role::Contributor);
});

it('resolves roles from an eager-loaded canvasUser relation without querying', function (): void {
    $user = User::factory()->editor()->create();
    $user->load('canvasUser');

    $queries = 0;
    DB::listen(function () use (&$queries): void {
        $queries++;
    });

    expect(CanvasUser::roleFor($user))->toBe(Role::Editor)
        ->and(CanvasUser::isAdmin($user))->toBeFalse()
        ->and(CanvasUser::isContributor($user))->toBeFalse();

    expect($queries)->toBe(0);
});

it('returns null from a loaded canvasUser relation set to null without querying', function (): void {
    $user = User::factory()->create();
    $user->setRelation('canvasUser', null);

    $queries = 0;
    DB::listen(function () use (&$queries): void {
        $queries++;
    });

    expect(CanvasUser::roleFor($user))->toBeNull()
        ->and(CanvasUser::isAdmin($user))->toBeFalse();

    expect($queries)->toBe(0);
});

it('resolves roles for bare hosts from a package-set canvasUser relation', function (): void {
    useBareUserModel();

    $host = User::factory()->create();
    $canvasUser = CanvasUser::factory()->admin()->create([
        'user_id' => $host->id,
    ]);

    $bare = bareUser($host->id);
    $bare->setRelation('canvasUser', $canvasUser);

    $queries = 0;
    DB::listen(function () use (&$queries): void {
        $queries++;
    });

    expect(CanvasUser::isAdmin($bare))->toBeTrue()
        ->and(CanvasUser::roleFor($bare))->toBe(Role::Admin);

    expect($queries)->toBe(0);
});

it('resolves roles from authenticatable identifiers that are not eloquent models', function (): void {
    $user = User::factory()->admin()->create();

    $authenticatable = new class($user->id) implements Authenticatable
    {
        public function __construct(private readonly int|string $id) {}

        public function getAuthIdentifierName(): string
        {
            return 'id';
        }

        public function getAuthIdentifier(): mixed
        {
            return $this->id;
        }

        public function getAuthPasswordName(): string
        {
            return 'password';
        }

        public function getAuthPassword(): string
        {
            return '';
        }

        public function getRememberToken(): ?string
        {
            return null;
        }

        public function setRememberToken($value): void {}

        public function getRememberTokenName(): string
        {
            return 'remember_token';
        }
    };

    expect(CanvasUser::roleFor($authenticatable))->toBe(Role::Admin)
        ->and(CanvasUser::isAdmin($authenticatable))->toBeTrue();
});

it('returns null when role resolution cannot identify a user', function (): void {
    expect(CanvasUser::roleFor((object) ['name' => 'anonymous']))->toBeNull();
});
