<?php

use Canvas\Http\Requests\UpdateIntegrationsRequest;

it('normalizes blank api keys and providers to null', function (): void {
    $request = makeFormRequest(UpdateIntegrationsRequest::class, [
        'ai' => [
            'provider' => '',
            'api_key' => '',
            'model' => '  ',
        ],
    ], $this->admin);

    $request->validateResolved();

    expect($request->input('ai.provider'))->toBeNull()
        ->and($request->input('ai.api_key'))->toBeNull()
        ->and($request->input('ai.model'))->toBeNull();
});

it('strips bearer prefixes from api keys during preparation', function (): void {
    $request = makeFormRequest(UpdateIntegrationsRequest::class, [
        'ai' => [
            'provider' => 'xai',
            'api_key' => 'Bearer sk-test-key',
        ],
    ], $this->admin);

    $request->validateResolved();

    expect($request->input('ai.api_key'))->toBe('sk-test-key');
});

it('normalizes blank webhook urls to null', function (): void {
    $request = makeFormRequest(UpdateIntegrationsRequest::class, [
        'webhooks' => [
            'url' => '   ',
            'events' => ['post.published'],
        ],
    ], $this->admin);

    $request->validateResolved();

    expect($request->input('webhooks.url'))->toBeNull();
});

it('accepts a public https webhook configuration', function (): void {
    $request = makeFormRequest(UpdateIntegrationsRequest::class, [
        'webhooks' => [
            'url' => 'https://example.com/hooks/canvas',
            'events' => ['post.published', 'post.updated'],
            'rotate_secret' => true,
        ],
    ], $this->admin);

    $request->validateResolved();

    expect($request->input('webhooks.url'))->toBe('https://example.com/hooks/canvas')
        ->and($request->input('webhooks.events'))->toBe(['post.published', 'post.updated'])
        ->and($request->input('webhooks.rotate_secret'))->toBeTrue();
});

it('rejects rotating the webhook secret when no url is configured', function (): void {
    assertFormRequestInvalid(
        UpdateIntegrationsRequest::class,
        [
            'webhooks' => [
                'rotate_secret' => true,
            ],
        ],
        $this->admin,
        ['webhooks.url'],
    );
});
