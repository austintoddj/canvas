<?php

use Canvas\Models\Post;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    Carbon::setTestNow(Carbon::parse('2026-08-15 12:00:00', config('app.timezone')));
});

afterEach(function (): void {
    Carbon::setTestNow();
});

it('returns posts with published_at in the requested range', function (): void {
    $inRange = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Mid-month post',
        'published_at' => Carbon::parse('2026-08-10 09:00:00'),
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Before range',
        'published_at' => Carbon::parse('2026-07-20 09:00:00'),
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'After range',
        'published_at' => Carbon::parse('2026-09-05 09:00:00'),
    ]);

    Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
        'title' => 'Draft ignored',
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-01&to=2026-08-31')
        ->assertSuccessful()
        ->assertJsonCount(1, 'posts')
        ->assertJsonPath('posts.0.id', (string) $inRange->id)
        ->assertJsonPath('posts.0.title', 'Mid-month post')
        ->assertJsonPath('posts.0.status', 'published')
        ->assertJsonStructure([
            'posts' => [
                [
                    'id',
                    'title',
                    'slug',
                    'published_at',
                    'featured_image',
                    'status',
                    'user' => [
                        'id',
                        'name',
                        'username',
                        'avatar_url',
                    ],
                ],
            ],
        ]);

    expect($response->json('posts.0.slug'))->toBe($inRange->slug);
});

it('classifies future published_at as scheduled', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Goes live later',
        'published_at' => Carbon::parse('2026-08-20 15:00:00'),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-01&to=2026-08-31')
        ->assertSuccessful()
        ->assertJsonPath('posts.0.status', 'scheduled')
        ->assertJsonPath('posts.0.title', 'Goes live later');
});

it('defaults to the authenticated user scope', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Admin post',
        'published_at' => Carbon::parse('2026-08-10 09:00:00'),
    ]);

    Post::factory()->create([
        'user_id' => $this->contributor->id,
        'title' => 'Contributor post',
        'published_at' => Carbon::parse('2026-08-11 09:00:00'),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-01&to=2026-08-31')
        ->assertSuccessful()
        ->assertJsonCount(1, 'posts')
        ->assertJsonPath('posts.0.title', 'Admin post');
});

it('returns all authors when scope=all and the user can view all posts', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Admin post',
        'published_at' => Carbon::parse('2026-08-10 09:00:00'),
    ]);

    Post::factory()->create([
        'user_id' => $this->contributor->id,
        'title' => 'Contributor post',
        'published_at' => Carbon::parse('2026-08-11 09:00:00'),
    ]);

    $titles = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-01&to=2026-08-31&scope=all')
        ->assertSuccessful()
        ->assertJsonCount(2, 'posts')
        ->json('posts.*.title');

    expect($titles)->toEqualCanonicalizing(['Admin post', 'Contributor post']);
});

it('ignores scope=all for contributors', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Admin post',
        'published_at' => Carbon::parse('2026-08-10 09:00:00'),
    ]);

    Post::factory()->create([
        'user_id' => $this->contributor->id,
        'title' => 'Contributor post',
        'published_at' => Carbon::parse('2026-08-11 09:00:00'),
    ]);

    $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-01&to=2026-08-31&scope=all')
        ->assertSuccessful()
        ->assertJsonCount(1, 'posts')
        ->assertJsonPath('posts.0.title', 'Contributor post');
});

it('orders posts by published_at ascending', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Second',
        'published_at' => Carbon::parse('2026-08-12 09:00:00'),
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'First',
        'published_at' => Carbon::parse('2026-08-05 09:00:00'),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-01&to=2026-08-31')
        ->assertSuccessful()
        ->assertJsonPath('posts.0.title', 'First')
        ->assertJsonPath('posts.1.title', 'Second');
});

it('requires from and to query parameters', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['from']);
});

it('rejects inverted or oversized ranges', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-08-31&to=2026-08-01')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['to']);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=2026-01-01&to=2026-06-01')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['to']);
});

it('rejects malformed dates', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/calendar/posts?from=08-01-2026&to=2026-08-31')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['from']);
});
