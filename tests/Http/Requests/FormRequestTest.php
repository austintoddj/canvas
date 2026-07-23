<?php

use Canvas\Http\Requests\FormRequest;
use Canvas\Tests\Stubs\AttributedFormRequest;
use Canvas\Tests\Stubs\CustomValidatorFormRequest;
use Canvas\Tests\Stubs\ExampleFormRequest;
use Canvas\Tests\Stubs\NoAuthorizeFormRequest;
use Canvas\Tests\Stubs\UnauthorizedFormRequest;

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
                'x' => 'canvas',
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

it('supports custom validator methods and lifecycle hooks', function (): void {
    $request = makeFormRequest(
        CustomValidatorFormRequest::class,
        ['name' => 'Canvas'],
        $this->admin,
    );

    $request->validateResolved();

    expect($request->validated())->toBe(['name' => 'Canvas']);
});

it('configures validation behaviour from foundation attributes', function (): void {
    $request = makeFormRequest(
        AttributedFormRequest::class,
        ['name' => 'Canvas'],
        $this->admin,
    );

    $request->validateResolved();

    expect($request->validated('name'))->toBe('Canvas')
        ->and($request->safe(['name']))->toBe(['name' => 'Canvas']);
});

it('treats confirmation fields as known when the base field is validated', function (): void {
    FormRequest::failOnUnknownFields(true);

    assertFormRequestValid(
        AttributedFormRequest::class,
        [
            'name' => 'Canvas',
            'password' => 'secret',
            'password_confirmation' => 'secret',
        ],
        $this->admin,
    );
});

it('fails authorization when authorize returns false', function (): void {
    assertFormRequestUnauthorized(
        UnauthorizedFormRequest::class,
        ['name' => 'Canvas'],
        $this->admin,
    );
});

it('passes authorization when no authorize method is defined', function (): void {
    assertFormRequestValid(
        NoAuthorizeFormRequest::class,
        ['name' => 'Canvas'],
        $this->admin,
    );
});

it('filters rules for precognitive validation requests', function (): void {
    $request = makeFormRequest(
        ExampleFormRequest::class,
        [
            'name' => 'Canvas',
            'social' => ['x' => 'canvas'],
        ],
        $this->admin,
    );

    $request->headers->set('Precognition', 'true');
    $request->headers->set('Precognition-Validate-Only', 'name');
    $request->attributes->set('precognitive', true);

    $method = new ReflectionMethod($request, 'createDefaultValidator');
    $method->setAccessible(true);

    $validator = $method->invoke($request, app('validator'));

    expect($validator->getRules())->toHaveKey('name')
        ->and($validator->getRules())->not->toHaveKey('social');
});
