<?php

use Canvas\Http\Requests\FormRequest;
use Canvas\Tests\Stubs\ExampleFormRequest;

afterEach(function (): void {
    FormRequest::flushState();
});

it('rejects unknown fields when fail on unknown fields is enabled', function (): void {
    FormRequest::failOnUnknownFields(true);

    assertFormRequestInvalid(
        ExampleFormRequest::class,
        [
            'name' => 'Canvas',
            'unexpected' => 'value',
        ],
        $this->admin,
        ['unexpected'],
    );
});

it('allows wildcard rule keys for nested input', function (): void {
    FormRequest::failOnUnknownFields(true);

    assertFormRequestValid(
        ExampleFormRequest::class,
        [
            'name' => 'Canvas',
            'social' => [
                'twitter' => 'canvas',
            ],
        ],
        $this->admin,
    );
});

it('resolves validated data after a successful request', function (): void {
    $request = makeFormRequest(
        ExampleFormRequest::class,
        [
            'name' => 'Canvas',
            'social' => [
                'github' => 'canvas',
            ],
        ],
        $this->admin,
    );

    $request->validateResolved();

    expect($request->validated())->toBe([
        'name' => 'Canvas',
        'social' => [
            'github' => 'canvas',
        ],
    ]);
});

it('flushes the global fail on unknown fields state', function (): void {
    FormRequest::failOnUnknownFields(true);
    FormRequest::flushState();

    assertFormRequestValid(
        ExampleFormRequest::class,
        [
            'name' => 'Canvas',
            'unexpected' => 'value',
        ],
        $this->admin,
    );
});
