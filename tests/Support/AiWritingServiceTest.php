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

it('omits provider hints for non-json and unusable error payloads', function (mixed $body, string $expected): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response($body, 500),
    ]);

    try {
        app(AiWritingService::class)->rewrite(AiWritingAction::Improve, 'Hello');
        expect(false)->toBeTrue('Expected AiWritingException.');
    } catch (AiWritingException $e) {
        expect($e->getMessage())->toBe($expected)
            ->and($e->errorCode)->toBe(AiWritingException::CodeFailed);
    }
})->with([
    'plain text body' => ['plain text failure', 'Could not complete the AI request. Try again.'],
    'nested error type' => [['error' => ['message' => ['type' => 'capacity']]], 'Could not complete the AI request. Try again. (capacity)'],
    'non-string error' => [['error' => 42], 'Could not complete the AI request. Try again.'],
    'blank message' => [['error' => ['message' => '   ']], 'Could not complete the AI request. Try again.'],
    'overlong message' => [['error' => ['message' => str_repeat('x', 201)]], 'Could not complete the AI request. Try again.'],
]);
