<?php

declare(strict_types=1);

use Canvas\Enums\AiProvider;
use Canvas\Exceptions\IntegrationVerificationException;
use Canvas\Support\IntegrationVerifier;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    Http::preventStrayRequests();
});

it('accepts an openai key when the models list succeeds', function (): void {
    Http::fake([
        'api.openai.com/v1/models' => Http::response([
            'data' => [['id' => 'gpt-4o-mini']],
        ], 200),
    ]);

    app(IntegrationVerifier::class)->verifyAi(AiProvider::OpenAi, 'sk-test', null);

    Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Bearer sk-test'));
});

it('accepts a 429 from the selected provider as a valid ai key', function (): void {
    Http::fake([
        'api.x.ai/v1/models' => Http::response(['error' => ['message' => 'rate limited']], 429),
    ]);

    expect(fn () => app(IntegrationVerifier::class)->verifyAi(AiProvider::Xai, 'xai-test', 'grok-4.3'))
        ->not->toThrow(IntegrationVerificationException::class);

    Http::assertSentCount(1);
});

it('rejects an ai key that the provider does not accept', function (): void {
    Http::fake([
        'api.openai.com/v1/models' => Http::response(['error' => ['message' => 'Incorrect API key']], 401),
    ]);

    expect(fn () => app(IntegrationVerifier::class)->verifyAi(AiProvider::OpenAi, 'xai-wrong', null))
        ->toThrow(IntegrationVerificationException::class);

    try {
        app(IntegrationVerifier::class)->verifyAi(AiProvider::OpenAi, 'xai-wrong', null);
    } catch (IntegrationVerificationException $exception) {
        expect($exception->field)->toBe('ai.api_key')
            ->and($exception->errorCode)->toBe(IntegrationVerificationException::CodeUnauthorized);
    }
});

it('rejects a custom model that is missing from the provider list', function (): void {
    Http::fake([
        'api.openai.com/v1/models' => Http::response([
            'data' => [['id' => 'gpt-4o-mini']],
        ], 200),
    ]);

    try {
        app(IntegrationVerifier::class)->verifyAi(AiProvider::OpenAi, 'sk-test', 'not-a-model');
        expect(false)->toBeTrue('Expected IntegrationVerificationException.');
    } catch (IntegrationVerificationException $exception) {
        expect($exception->field)->toBe('ai.model')
            ->and($exception->errorCode)->toBe(IntegrationVerificationException::CodeModelNotFound);
    }
});

it('probes anthropic with the anthropic key header', function (): void {
    Http::fake([
        'api.anthropic.com/v1/models' => Http::response([
            'data' => [['id' => 'claude-haiku-4-5']],
        ], 200),
    ]);

    app(IntegrationVerifier::class)->verifyAi(AiProvider::Anthropic, 'sk-ant-test', 'claude-haiku-4-5');

    Http::assertSent(function ($request): bool {
        return $request->url() === 'https://api.anthropic.com/v1/models'
            && ($request->header('x-api-key')[0] ?? null) === 'sk-ant-test'
            && ($request->header('anthropic-version')[0] ?? null) === '2023-06-01';
    });
});

it('accepts an unsplash key when the photos request succeeds', function (): void {
    Http::fake([
        'api.unsplash.com/photos*' => Http::response([['id' => 'photo']], 200),
    ]);

    app(IntegrationVerifier::class)->verifyUnsplash('unsplash-key');

    Http::assertSent(fn ($request): bool => str_contains($request->url(), 'api.unsplash.com/photos')
        && ($request->header('Authorization')[0] ?? null) === 'Client-ID unsplash-key');
});

it('rejects an unsplash key that unsplash does not accept', function (): void {
    Http::fake([
        'api.unsplash.com/photos*' => Http::response(['errors' => ['OAuth error']], 401),
    ]);

    try {
        app(IntegrationVerifier::class)->verifyUnsplash('bad-key');
        expect(false)->toBeTrue('Expected IntegrationVerificationException.');
    } catch (IntegrationVerificationException $exception) {
        expect($exception->field)->toBe('unsplash.access_key')
            ->and($exception->errorCode)->toBe(IntegrationVerificationException::CodeUnauthorized);
    }
});

it('treats an unsplash 429 as a valid key', function (): void {
    Http::fake([
        'api.unsplash.com/photos*' => Http::response(['errors' => ['Rate Limit Exceeded']], 429),
    ]);

    expect(fn () => app(IntegrationVerifier::class)->verifyUnsplash('throttled-key'))
        ->not->toThrow(IntegrationVerificationException::class);

    Http::assertSentCount(1);
});
