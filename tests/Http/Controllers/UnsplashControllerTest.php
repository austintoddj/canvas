<?php

use Illuminate\Support\Facades\Http;

it('returns results from the Unsplash API', function (): void {
    config(['canvas.unsplash.access_key' => 'test-access-key']);

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
    config(['canvas.unsplash.access_key' => null]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/unsplash?query=mountains')
        ->assertStatus(422)
        ->assertJsonStructure(['error']);
});

it('requires authentication to search unsplash', function (): void {
    $this->getJson('canvas/api/unsplash?query=mountains')
        ->assertUnauthorized();
});
