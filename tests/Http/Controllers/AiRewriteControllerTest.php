<?php

use Canvas\Enums\AiProvider;
use Canvas\Exceptions\AiWritingException;
use Illuminate\Http\Client\ConnectionException;
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
            && $request['model'] === 'grok-4.3'
            && $request['max_tokens'] === 2048
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
            && $request['model'] === AiProvider::Anthropic->defaultModel()
            && $request['max_tokens'] === 2048;
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
        ->assertJsonPath('error', 'AI is not configured.')
        ->assertJsonPath('code', AiWritingException::CodeNotConfigured);
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
        )
        ->assertJsonPath('code', AiWritingException::CodeUnauthorized);
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
        )
        ->assertJsonPath('code', AiWritingException::CodeForbidden);
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
        )
        ->assertJsonPath('code', AiWritingException::CodeModelNotFound);
});

it('retries once on rate limit then succeeds', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::sequence()
            ->push(['error' => ['message' => 'Rate limit']], 429)
            ->push([
                'choices' => [
                    ['message' => ['content' => 'After retry.']],
                ],
            ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'After retry.');

    Http::assertSentCount(2);
});

it('returns rate limited after exhausted retries', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response(['error' => ['message' => 'Rate limit']], 429),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', 'The AI provider rate limit was exceeded. Try again shortly.')
        ->assertJsonPath('code', AiWritingException::CodeRateLimited);

    Http::assertSentCount(2);
});

it('maps connection failures to a timeout-oriented error', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake(function () {
        throw new ConnectionException('cURL error 28: Operation timed out');
    });

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', AiWritingException::CodeTimeout)
        ->assertJsonPath(
            'error',
            'The AI provider took too long or could not be reached. Try again, or set a faster model in Integrations.'
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

it('suggests seo title and description in one request', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => '{"title":"How to Ship Better SEO","description":"A practical guide to writing titles and meta descriptions that earn clicks."}']],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'suggest_seo',
            'text' => "Title: Shipping posts\n\nSummary: A guide to publishing.",
        ])
        ->assertSuccessful()
        ->assertJsonPath('title', 'How to Ship Better SEO')
        ->assertJsonPath('description', 'A practical guide to writing titles and meta descriptions that earn clicks.');

    Http::assertSent(function ($request): bool {
        $system = $request['messages'][0]['content'] ?? '';
        $user = $request['messages'][1]['content'] ?? '';

        return is_string($system)
            && is_string($user)
            && str_contains($system, 'SEO title')
            && str_contains($user, 'Generate from the following post content')
            && str_contains($user, 'Shipping posts')
            && $request['max_tokens'] === 400;
    });
});

it('parses seo json wrapped in markdown fences', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => "```json\n{\"title\":\"T\",\"description\":\"D\"}\n```"]],
            ],
        ]),
    ]);

    $this->actingAs($this->contributor, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'suggest_seo',
            'text' => 'Title: Meta tips',
        ])
        ->assertSuccessful()
        ->assertJsonPath('title', 'T')
        ->assertJsonPath('description', 'D');
});

it('rejects oversized seo payloads', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'suggest_seo',
            'text' => str_repeat('a', 3001),
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['text']);
});

it('allows larger rewrite payloads under the rewrite limit', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'ok']],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => str_repeat('a', 5000),
        ])
        ->assertSuccessful();
});

it('requires authentication for rewrite', function (): void {
    $this->postJson('canvas/api/ai/rewrite', [
        'action' => 'improve',
        'text' => 'Hello',
    ])->assertUnauthorized();
});
