<?php

use Canvas\Enums\AiProvider;
use Canvas\Enums\AiWritingAction;
use Canvas\Exceptions\AiWritingException;
use Canvas\Support\AiWritingService;
use Illuminate\Support\Facades\Http;

it('throws when ai is not configured at the service layer', function (): void {
    $service = app(AiWritingService::class);

    expect(fn () => $service->rewrite(AiWritingAction::Improve, 'Hello'))
        ->toThrow(AiWritingException::class, 'AI is not configured.');
});

it('asks rewrite models to preserve paragraph structure', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => "Para one.\n\nPara two."]],
            ],
        ]),
    ]);

    app(AiWritingService::class)->rewrite(
        AiWritingAction::Expand,
        "First paragraph.\n\nSecond paragraph.",
    );

    Http::assertSent(function ($request): bool {
        $system = $request['messages'][0]['content'] ?? '';

        return is_string($system)
            && str_contains($system, 'Preserve paragraph structure')
            && str_contains($system, 'blank line')
            && str_contains($system, 'keep distinct paragraphs separate');
    });
});

it('does not inject paragraph guidance into seo system prompts', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => '{"title":"T","description":"D"}']],
            ],
        ]),
    ]);

    app(AiWritingService::class)->rewrite(
        AiWritingAction::SuggestSeo,
        "Title: Shipping\n\nSummary: A guide.",
    );

    Http::assertSent(function ($request): bool {
        $system = $request['messages'][0]['content'] ?? '';

        return is_string($system)
            && str_contains($system, 'SEO title')
            && ! str_contains($system, 'Preserve paragraph structure');
    });
});

it('sanitizes provider detail without embedding it in the primary message', function (mixed $body, ?string $expectedDetail): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response($body, 500),
    ]);

    try {
        app(AiWritingService::class)->rewrite(AiWritingAction::Improve, 'Hello');
        expect(false)->toBeTrue('Expected AiWritingException.');
    } catch (AiWritingException $e) {
        expect($e->getMessage())->toBe('Could not complete the AI request. Try again.')
            ->and($e->errorCode)->toBe(AiWritingException::CodeFailed)
            ->and($e->detail)->toBe($expectedDetail);
    }
})->with([
    'plain text body' => ['plain text failure', null],
    'nested error type' => [['error' => ['message' => ['type' => 'capacity']]], 'capacity'],
    'non-string error' => [['error' => 42], null],
    'blank message' => [['error' => ['message' => '   ']], null],
    'overlong message' => [['error' => ['message' => str_repeat('x', 201)]], null],
]);
