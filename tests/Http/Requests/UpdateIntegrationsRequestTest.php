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
