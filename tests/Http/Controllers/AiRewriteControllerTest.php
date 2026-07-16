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
        ->assertJsonPath(
            'error',
            'The AI API key was rejected. Re-paste the key in Integrations (without a “Bearer ” prefix).'
        );
});

it('maps forbidden responses to a permission-oriented error', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'error' => ['message' => 'Model access denied for this team.'],
        ], 403),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath(
            'error',
            'The AI provider denied access. Confirm API credits, region/team permissions, and model access'
            .' in the provider console, or set a different model in Integrations. (Model access denied for this team.)'
        );
});

it('maps missing models to a clear error', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key', 'not-a-real-model');

    Http::fake([
        'api.x.ai/*' => Http::response(['error' => ['message' => 'Model not found']], 404),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath(
            'error',
            'The AI model was not found. Set a valid model id in Integrations settings. (Model not found)'
        );
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

it('generates an seo title from post content', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'How to Ship Better SEO Titles']],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'seo_title',
            'text' => "Title: Shipping posts\n\nBody:\nA guide to publishing.",
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'How to Ship Better SEO Titles');

    Http::assertSent(function ($request): bool {
        $system = $request['messages'][0]['content'] ?? '';
        $user = $request['messages'][1]['content'] ?? '';

        return is_string($system)
            && is_string($user)
            && str_contains($system, 'SEO title')
            && str_contains($user, 'Generate from the following post content')
            && str_contains($user, 'Shipping posts');
    });
});

it('generates a meta description from post content', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'A practical guide to writing meta descriptions that convert clicks.']],
            ],
        ]),
    ]);

    $this->actingAs($this->contributor, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'seo_description',
            'text' => "Title: Meta tips\n\nSummary: Click-worthy descriptions.",
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'A practical guide to writing meta descriptions that convert clicks.');
});

it('requires authentication for rewrite', function (): void {
    $this->postJson('canvas/api/ai/rewrite', [
        'action' => 'improve',
        'text' => 'Hello',
    ])->assertUnauthorized();
});
