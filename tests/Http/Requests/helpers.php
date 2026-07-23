<?php

declare(strict_types=1);

use Canvas\Http\Requests\FormRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Routing\Route;
use Illuminate\Validation\ValidationException;

function makeFormRequest(
    string $requestClass,
    array $data,
    object $user,
    array $routeParameters = [],
    string $uri = '/canvas/api/test',
    string $method = 'POST',
    array $files = [],
): FormRequest {
    $request = $requestClass::create($uri, $method, $data, [], $files);
    $request->setContainer(app());
    $request->setRedirector(app('redirect'));
    $request->setUserResolver(fn () => $user);

    $route = new Route([$method], $uri, []);
    $route->bind($request);

    foreach ($routeParameters as $name => $value) {
        $route->setParameter($name, $value);
    }

    $request->setRouteResolver(fn () => $route);

    /** @var FormRequest $formRequest */
    $formRequest = $requestClass::createFromBase($request);
    $formRequest->setContainer(app());
    $formRequest->setRedirector(app('redirect'));
    $formRequest->setUserResolver(fn () => $user);
    $formRequest->setRouteResolver(fn () => $route);

    auth(config('canvas.guard'))->setUser($user);
    app()->instance('request', $formRequest);

    return $formRequest;
}

function assertFormRequestValid(
    string $requestClass,
    array $data,
    object $user,
    array $routeParameters = [],
    string $uri = '/canvas/api/test',
    string $method = 'POST',
    array $files = [],
): void {
    $request = makeFormRequest(
        $requestClass,
        $data,
        $user,
        $routeParameters,
        $uri,
        $method,
        $files,
    );

    $request->validateResolved();

    expect(true)->toBeTrue();
}

function assertFormRequestInvalid(
    string $requestClass,
    array $data,
    object $user,
    array $expectedErrorKeys,
    array $routeParameters = [],
    string $uri = '/canvas/api/test',
    string $method = 'POST',
    array $files = [],
): void {
    $request = makeFormRequest(
        $requestClass,
        $data,
        $user,
        $routeParameters,
        $uri,
        $method,
        $files,
    );

    try {
        $request->validateResolved();

        expect(false)->toBeTrue('Expected validation to fail.');
    } catch (ValidationException $exception) {
        foreach ($expectedErrorKeys as $key) {
            expect($exception->errors())->toHaveKey($key);
        }
    }
}

function assertFormRequestUnauthorized(
    string $requestClass,
    array $data,
    object $user,
    array $routeParameters = [],
    string $uri = '/canvas/api/test',
    string $method = 'POST',
    array $files = [],
): void {
    $request = makeFormRequest(
        $requestClass,
        $data,
        $user,
        $routeParameters,
        $uri,
        $method,
        $files,
    );

    try {
        $request->validateResolved();

        expect(false)->toBeTrue('Expected authorization to fail.');
    } catch (AuthorizationException) {
        expect(true)->toBeTrue();
    }
}
