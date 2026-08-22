<?php

use Canvas\Enums\AiProvider;
use Canvas\Enums\IntegrationStatus;
use Canvas\Enums\SettingKey;
use Canvas\Models\Post;
use Canvas\Policies\UserPolicy;
use Canvas\Support\SettingsRepository;
use Canvas\Tests\Models\BareUser;
use Canvas\Tests\TestCase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;

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

/**
 * ISO-8601 with offset/Z for HTTP published_at payloads (v7 wire contract).
 */
function publishedAtIso(DateTimeInterface|string|null $at = null): string
{
    if ($at === null) {
        return now()->toIso8601String();
    }

    if (is_string($at)) {
        return Carbon::parse($at)->toIso8601String();
    }

    return Carbon::instance(DateTimeImmutable::createFromInterface($at))->toIso8601String();
}

function setUnsplashAccessKey(?string $key): void
{
    app(SettingsRepository::class)->set(SettingKey::UnsplashAccessKey, $key);
}

function setAiIntegration(?AiProvider $provider, ?string $key = null, ?string $model = null): void
{
    $settings = app(SettingsRepository::class);

    $settings->set(SettingKey::AiProvider, $provider?->value);
    $settings->set(SettingKey::AiApiKey, $key);
    $settings->set(SettingKey::AiModel, $model);
}

/**
 * @param  list<string>  $events
 */
function configureWebhooks(
    string $url = 'https://example.com/hooks/canvas',
    string $secret = 'whsec_test_secret',
    array $events = ['post.published', 'post.updated', 'post.deleted'],
): void {
    $settings = app(SettingsRepository::class);
    $settings->set(SettingKey::WebhookUrl, $url);
    $settings->set(SettingKey::WebhookSecret, $secret);
    $settings->set(SettingKey::WebhookEvents, json_encode(array_values($events), JSON_THROW_ON_ERROR));
    $settings->set(SettingKey::WebhookStatus, IntegrationStatus::Enabled->value);
    $settings->set(SettingKey::WebhookVerifiedAt, now()->toIso8601String());
}

/**
 * Keep stored webhook credentials without a successful test handshake.
 */
function markWebhooksPending(): void
{
    $settings = app(SettingsRepository::class);
    $settings->forget(SettingKey::WebhookStatus);
    $settings->forget(SettingKey::WebhookVerifiedAt);
}

function fakeSuccessfulIntegrationProbes(): void
{
    Http::fake([
        'api.unsplash.com/*' => Http::response([['id' => 'photo']], 200),
        'api.openai.com/*' => Http::response([
            'data' => [
                ['id' => 'gpt-4o-mini'],
                ['id' => 'gpt-4o'],
                ['id' => 'gpt-5.6-terra'],
            ],
        ], 200),
        'api.x.ai/*' => Http::response([
            'data' => [
                ['id' => 'grok-4.3'],
                ['id' => 'grok-4.5'],
                ['id' => 'grok-custom'],
            ],
        ], 200),
        'api.anthropic.com/*' => Http::response([
            'data' => [
                ['id' => 'claude-haiku-4-5'],
                ['id' => 'claude-sonnet-5'],
            ],
        ], 200),
        'https://example.com/*' => Http::response(['ok' => true], 200),
    ]);
}
