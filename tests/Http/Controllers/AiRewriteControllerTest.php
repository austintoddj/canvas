<?php

use Canvas\Enums\AiProvider;
use Illuminate\Support\Facades\Http;

it('rewrites text with the xai openai-compatible api', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Improved sentence.']],
            ],
        ]),
    ]);

    $this->actingAs($this->contributor, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'bad sentence',
            'title' => 'My post',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'Improved sentence.');

    Http::assertSent(function ($request): bool {
        return $request->url() === 'https://api.x.ai/v1/chat/completions'
            && $request->hasHeader('Authorization', 'Bearer xai-test-key')
            && $request['model'] === AiProvider::Xai->defaultModel()
            && str_contains($request['messages'][1]['content'], 'bad sentence');
    });
});

it('rewrites text with the openai api', function (): void {
    setAiIntegration(AiProvider::OpenAi, 'openai-test-key', 'gpt-4o');

    Http::fake([
        'api.openai.com/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Shorter text.']],
            ],
        ]),
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'shorten',
            'text' => 'A rather long and wordy sentence that could be tighter.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'Shorter text.');

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'api.openai.com/v1/chat/completions')
            && $request['model'] === 'gpt-4o';
    });
});

it('rewrites text with the anthropic messages api', function (): void {
    setAiIntegration(AiProvider::Anthropic, 'anthropic-test-key');

    Http::fake([
        'api.anthropic.com/*' => Http::response([
            'content' => [
                ['type' => 'text', 'text' => 'Expanded idea with more detail.'],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'expand',
            'text' => 'A short idea.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'Expanded idea with more detail.');

    Http::assertSent(function ($request): bool {
        return $request->url() === 'https://api.anthropic.com/v1/messages'
            && $request->hasHeader('x-api-key', 'anthropic-test-key')
            && $request->hasHeader('anthropic-version', '2023-06-01')
            && $request['model'] === AiProvider::Anthropic->defaultModel();
    });
});

it('requires a custom instruction for the custom action', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'custom',
            'text' => 'Hello world',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['instruction']);
});

it('accepts a custom instruction', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Hello, world!']],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'custom',
            'text' => 'Hello world',
            'instruction' => 'Add punctuation',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'Hello, world!');
});

it('returns 422 when ai is not configured', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', 'AI is not configured.');
});

it('maps rejected api keys to a clear error', function (): void {
    setAiIntegration(AiProvider::Xai, 'bad-key');

    Http::fake([
        'api.x.ai/*' => Http::response(['error' => 'Unauthorized'], 401),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'fix_grammar',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', 'The AI API key was rejected. Check Integrations settings.');
});

it('strips surrounding markdown fences from provider output', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => "```\nClean text\n```"]],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'messy text',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'Clean text');
});

it('validates rewrite payload', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'not-real',
            'text' => '',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['action', 'text']);
});

it('requires authentication for rewrite', function (): void {
    $this->postJson('canvas/api/ai/rewrite', [
        'action' => 'improve',
        'text' => 'Hello',
    ])->assertUnauthorized();
});
