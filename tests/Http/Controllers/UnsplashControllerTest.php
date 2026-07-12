<?php

use Illuminate\Support\Facades\Http;

it('returns results from the Unsplash API', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response([
            'results' => [
                ['id' => 'abc', 'description' => 'A photo'],
            ],
            'total' => 1,
        ], 200),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains')
        ->assertSuccessful()
        ->assertJsonStructure(['results', 'total']);

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'unsplash.com/search/photos')
            && str_contains($request->url(), 'mountains');
    });
});

it('returns 422 when the access key is not configured', function (): void {
    setUnsplashAccessKey(null);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains')
        ->assertStatus(422)
        ->assertJsonStructure(['error']);
});

it('returns 422 when the search query is empty', function (): void {
    setUnsplashAccessKey('test-access-key');

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=')
        ->assertStatus(422)
        ->assertJsonPath('error', 'A search query is required.');
});

it('requires authentication to search unsplash', function (): void {
    $this->getJson('canvas/api/unsplash?query=mountains')
        ->assertUnauthorized();
});

it('forwards not found responses from the unsplash api', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response(['errors' => ['Not Found']], 404),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains')
        ->assertStatus(404)
        ->assertJsonPath('errors.0', 'Not Found');
});

it('forwards server error responses from the unsplash api', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response(['error' => 'Service unavailable'], 503),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains')
        ->assertStatus(503)
        ->assertJsonPath('error', 'Service unavailable');
});

it('forwards rate limit responses from the unsplash api', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response(['error' => 'Rate Limit Exceeded'], 429),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains')
        ->assertStatus(429)
        ->assertJsonPath('error', 'Rate Limit Exceeded');
});
