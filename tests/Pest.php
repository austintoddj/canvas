<?php

use Canvas\Enums\SettingKey;
use Canvas\Models\Post;
use Canvas\Policies\UserPolicy;
use Canvas\Support\SettingsRepository;
use Canvas\Tests\Models\BareUser;
use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Gate;

uses(TestCase::class)->in('.');

require_once __DIR__.'/Http/Requests/helpers.php';

/*
|--------------------------------------------------------------------------
| Test documentation conventions
|--------------------------------------------------------------------------
|
| After fixing a production bug, mark the covering test with:
|   // Regression: GH-647 — short description of the bug
|
| For long-standing package behavior with no filed bug, use:
|   // Invariant: short description of the expected behavior
|
*/

function useBareUserModel(): void
{
    config()->set('canvas.user_model', BareUser::class);
    Gate::policy(BareUser::class, UserPolicy::class);
}

function bareUser(int|string $id): BareUser
{
    return BareUser::query()->findOrFail($id);
}

function createPublishedPost(array $attributes = []): Post
{
    return Post::factory()->create(array_merge([
        'published_at' => now()->subDay(),
    ], $attributes));
}

function createDraftPost(array $attributes = []): Post
{
    return Post::factory()->create(array_merge([
        'published_at' => null,
    ], $attributes));
}

/**
 * @return array{published: Post, draft: Post}
 */
function createPublishedAndDraftPosts(int|string $userId): array
{
    return [
        'published' => createPublishedPost(['user_id' => $userId]),
        'draft' => createDraftPost(['user_id' => $userId]),
    ];
}

function createPublishedPosts(int|string $userId, int $count = 2): void
{
    Post::factory()->count($count)->create([
        'user_id' => $userId,
        'published_at' => now()->subDay(),
    ]);
}

function setUnsplashAccessKey(?string $key): void
{
    app(SettingsRepository::class)->set(SettingKey::UnsplashAccessKey, $key);
}
