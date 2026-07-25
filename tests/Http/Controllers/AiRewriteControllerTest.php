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

it('returns 422 when ai has a provider but an empty api key', function (): void {
    setAiIntegration(AiProvider::Xai, '');

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
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
            .' in the provider console, or set a different model in Integrations.'
        )
        ->assertJsonPath('code', AiWritingException::CodeForbidden)
        ->assertJsonPath('detail', 'Model access denied for this team.');
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
            'The AI model was not found. Set a valid model id in Integrations settings.'
        )
        ->assertJsonPath('code', AiWritingException::CodeModelNotFound)
        ->assertJsonPath('detail', 'Model not found');
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
        ->assertJsonPath('code', AiWritingException::CodeRateLimited)
        ->assertJsonPath('detail', 'Rate limit');

    Http::assertSentCount(2);
});

it('maps insufficient quota on 429 to a quota error not rate limit', function (): void {
    setAiIntegration(AiProvider::OpenAi, 'openai-test-key');

    Http::fake([
        'api.openai.com/*' => Http::response([
            'error' => [
                'message' => 'You exceeded your current quota, please check your plan and billing details.',
                'type' => 'insufficient_quota',
                'code' => 'insufficient_quota',
            ],
        ], 429),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', AiWritingException::CodeQuotaExceeded)
        ->assertJsonPath(
            'error',
            'The AI provider reports insufficient credits or quota. Check billing in the provider console, or switch provider in Integrations.'
        )
        ->assertJsonPath(
            'detail',
            'You exceeded your current quota, please check your plan and billing details.'
        );

    // Quota is not treated as a transient rate limit: no retry.
    Http::assertSentCount(1);
});

it('maps context length failures to a dedicated error', function (): void {
    setAiIntegration(AiProvider::OpenAi, 'openai-test-key');

    Http::fake([
        'api.openai.com/*' => Http::response([
            'error' => [
                'message' => "This model's maximum context length is 8192 tokens.",
                'type' => 'invalid_request_error',
                'code' => 'context_length_exceeded',
            ],
        ], 400),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', AiWritingException::CodeContextLength)
        ->assertJsonPath(
            'error',
            'Selection or post content is too long for this model. Shorten the text and try again.'
        )
        ->assertJsonPath('detail', "This model's maximum context length is 8192 tokens.");
});

it('maps context length from message text without a provider code', function (): void {
    setAiIntegration(AiProvider::Anthropic, 'anthropic-test-key');

    Http::fake([
        'api.anthropic.com/*' => Http::response([
            'type' => 'error',
            'error' => [
                'type' => 'invalid_request_error',
                'message' => 'prompt is too long: 200000 tokens > 200000 maximum',
            ],
        ], 400),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', AiWritingException::CodeContextLength)
        ->assertJsonPath('detail', 'prompt is too long: 200000 tokens > 200000 maximum');
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

it('maps empty provider content to a clear error', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => '   ']],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', 'The AI provider returned an empty response.')
        ->assertJsonPath('code', AiWritingException::CodeEmpty);
});

it('maps empty anthropic content to a clear error', function (): void {
    setAiIntegration(AiProvider::Anthropic, 'anthropic-test-key');

    Http::fake([
        'api.anthropic.com/*' => Http::response([
            'content' => [
                ['type' => 'text', 'text' => ''],
                ['type' => 'tool_use', 'text' => 'ignored'],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', AiWritingException::CodeEmpty);
});

it('maps unexpected provider failures with a safe detail field', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'error' => ['message' => 'Upstream capacity exhausted'],
        ], 500),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', 'Could not complete the AI request. Try again.')
        ->assertJsonPath('code', AiWritingException::CodeFailed)
        ->assertJsonPath('detail', 'Upstream capacity exhausted');
});

it('omits provider details that look like secrets', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'error' => ['message' => 'Invalid api key sk-abc123xyz'],
        ], 500),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', 'Could not complete the AI request. Try again.')
        ->assertJsonPath('code', AiWritingException::CodeFailed)
        ->assertJsonMissingPath('detail');
});

it('omits provider details longer than 200 characters', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'error' => ['message' => str_repeat('x', 201)],
        ], 500),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', AiWritingException::CodeFailed)
        ->assertJsonMissingPath('detail');
});

it('rejects unusable seo suggestions', function (array $content, string $message): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => $content['raw']]],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'suggest_seo',
            'text' => 'Title: Shipping posts',
        ])
        ->assertStatus(422)
        ->assertJsonPath('error', $message)
        ->assertJsonPath('code', AiWritingException::CodeEmpty);
})->with([
    'plain text' => [['raw' => 'not json at all'], 'The AI provider returned an unusable SEO suggestion.'],
    'embedded json missing fields' => [['raw' => 'Here you go: {"title":"Only title"}'], 'The AI provider returned an unusable SEO suggestion.'],
    'empty strings' => [['raw' => '{"title":"  ","description":"  "}'], 'The AI provider returned an empty SEO suggestion.'],
]);

it('normalizes blank instruction and title before validation', function (): void {
    setAiIntegration(AiProvider::Xai, 'xai-test-key');

    Http::fake([
        'api.x.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Cleaned.']],
            ],
        ]),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/ai/rewrite', [
            'action' => 'improve',
            'text' => 'Hello',
            'instruction' => '',
            'title' => '',
        ])
        ->assertSuccessful()
        ->assertJsonPath('text', 'Cleaned.');
});
