<?php

use Canvas\Enums\AiProvider;
use Canvas\Http\Requests\AiRewriteRequest;

it('normalizes blank instruction and title to null', function (): void {
    setAiIntegration(AiProvider::Xai, 'key');

    $request = makeFormRequest(AiRewriteRequest::class, [
        'action' => 'improve',
        'text' => 'Hello world',
        'instruction' => '',
        'title' => '',
    ], $this->admin);

    $request->validateResolved();

    expect($request->input('instruction'))->toBeNull()
        ->and($request->input('title'))->toBeNull();
});

it('requires instruction for custom rewrites', function (): void {
    setAiIntegration(AiProvider::Xai, 'key');

    assertFormRequestInvalid(
        AiRewriteRequest::class,
        [
            'action' => 'custom',
            'text' => 'Hello world',
        ],
        $this->admin,
        ['instruction'],
    );
});
