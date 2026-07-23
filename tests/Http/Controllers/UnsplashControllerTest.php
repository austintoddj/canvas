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
            && str_contains($request->url(), 'mountains')
            && str_contains($request->url(), 'page=1')
            && str_contains($request->url(), 'per_page=30');
    });
});

it('forwards the page parameter to the Unsplash API', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response([
            'results' => [
                ['id' => 'def', 'description' => 'Another photo'],
            ],
            'total' => 60,
            'total_pages' => 2,
        ], 200),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains&page=2')
        ->assertSuccessful();

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'unsplash.com/search/photos')
            && str_contains($request->url(), 'mountains')
            && str_contains($request->url(), 'page=2');
    });
});

it('forwards a clamped per_page parameter to the Unsplash API', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response([
            'results' => [],
            'total' => 0,
            'total_pages' => 0,
        ], 200),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains&per_page=18')
        ->assertSuccessful();

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'per_page=18');
    });

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains&per_page=99')
        ->assertSuccessful();

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'per_page=30');
    });
});

it('clamps invalid page values to page 1', function (): void {
    setUnsplashAccessKey('test-access-key');

    Http::fake([
        'api.unsplash.com/*' => Http::response([
            'results' => [],
            'total' => 0,
            'total_pages' => 0,
        ], 200),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains&page=0')
        ->assertSuccessful();

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'page=1');
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
