<?php

use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Illuminate\Support\Carbon;

it('fetches user stats by default', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->admin->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(2)->make()->toArray());
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    });

    Post::factory()->count(2)->create([
        'user_id' => $this->contributor->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(1)->make()->toArray());
        $post->views()->createMany(View::factory()->count(2)->make()->toArray());
    });

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats')
        ->assertSuccessful()
        ->assertJsonStructure([
            'views',
            'visits',
            'graph' => [
                'views',
                'visits',
            ],
            'monthOverMonthViews' => [
                'direction',
                'percentage',
                'comparable',
            ],
            'monthOverMonthVisits' => [
                'direction',
                'percentage',
                'comparable',
            ],
            'topReferers',
            'library' => [
                'published',
                'drafts',
                'scheduled',
                'pending_updates',
            ],
            'pipeline' => [
                'drafts',
                'scheduled',
                'pending',
            ],
            'recent_posts',
            'top_posts',
        ])
        ->assertJsonFragment([
            'views' => 9,
            'visits' => 6,
        ])
        ->assertJsonPath('library.published', 3);
});

it('fetches all post stats with a given query scope', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->admin->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(2)->make()->toArray());
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    });

    Post::factory()->count(2)->create([
        'user_id' => $this->contributor->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(1)->make()->toArray());
        $post->views()->createMany(View::factory()->count(2)->make()->toArray());
    });

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats?scope=all')
        ->assertSuccessful()
        ->assertJsonStructure([
            'views',
            'visits',
            'graph' => [
                'views',
                'visits',
            ],
            'library',
            'recent_posts',
            'top_posts',
        ])
        ->assertJsonFragment([
            'views' => 13,
            'visits' => 8,
        ])
        ->assertJsonPath('library.published', 5);
});

it('includes library counts, pipeline lists, and recent posts ordered by updated_at', function (): void {
    $older = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Older post',
        'published_at' => now()->subWeek(),
    ]);
    $older->forceFill(['updated_at' => now()->subDays(3)])->saveQuietly();

    $draft = Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
        'title' => 'Draft post',
    ]);
    $draft->forceFill(['updated_at' => now()->subDay()])->saveQuietly();

    $scheduled = Post::factory()->scheduled()->create([
        'user_id' => $this->admin->id,
        'title' => 'Scheduled post',
    ]);
    $scheduled->forceFill(['updated_at' => now()->subHours(2)])->saveQuietly();

    $pending = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Pending post',
        'published_at' => now()->subDay(),
        'pending' => [
            'title' => 'Edited',
            'slug' => 'edited',
        ],
    ]);
    $pending->forceFill(['updated_at' => now()])->saveQuietly();

    Post::factory()->create([
        'user_id' => $this->contributor->id,
        'title' => 'Other author',
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats')
        ->assertSuccessful()
        ->assertJsonPath('library.published', 2)
        ->assertJsonPath('library.drafts', 1)
        ->assertJsonPath('library.scheduled', 1)
        ->assertJsonPath('library.pending_updates', 1);

    $titles = collect($response->json('recent_posts'))->pluck('title')->all();

    expect($titles)->toBe([
        'Pending post',
        'Scheduled post',
        'Draft post',
        'Older post',
    ])
        ->and($response->json('recent_posts.0.has_pending_changes'))->toBeTrue()
        ->and($response->json('recent_posts.0.id'))->toBe($pending->id)
        ->and($titles)->not->toContain('Other author')
        ->and($response->json('pipeline.drafts.0.id'))->toBe($draft->id)
        ->and($response->json('pipeline.drafts.0.title'))->toBe('Draft post')
        ->and($response->json('pipeline.scheduled.0.id'))->toBe($scheduled->id)
        ->and($response->json('pipeline.pending.0.id'))->toBe($pending->id);
});

it('ranks top posts by views in the last 30 days', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

    $quiet = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Quiet post',
        'published_at' => now()->subWeek(),
    ]);

    $popular = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Popular post',
        'published_at' => now()->subWeek(),
    ]);

    $runnerUp = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Runner up',
        'published_at' => now()->subWeek(),
    ]);

    View::factory()->count(5)->create([
        'post_id' => $popular->id,
        'created_at' => now()->subDays(2),
        'referer' => 'https://news.example',
    ]);

    View::factory()->count(2)->create([
        'post_id' => $runnerUp->id,
        'created_at' => now()->subDays(1),
        'referer' => 'https://social.example',
    ]);

    View::factory()->count(10)->create([
        'post_id' => $quiet->id,
        'created_at' => now()->subDays(45),
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats')
        ->assertSuccessful()
        ->assertJsonPath('days', 30);

    expect($response->json('top_posts'))->toEqual([
        [
            'id' => $popular->id,
            'title' => 'Popular post',
            'views' => 5,
        ],
        [
            'id' => $runnerUp->id,
            'title' => 'Runner up',
            'views' => 2,
        ],
    ])
        ->and($response->json('topReferers')['https://news.example'] ?? null)->toBe(5);

    Carbon::setTestNow();
});

it('scopes analytics to the requested days window', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Ranged post',
        'published_at' => now()->subMonths(6),
    ]);

    View::factory()->count(3)->create([
        'post_id' => $post->id,
        'created_at' => now()->subDays(3),
    ]);

    View::factory()->count(4)->create([
        'post_id' => $post->id,
        'created_at' => now()->subDays(20),
    ]);

    View::factory()->count(5)->create([
        'post_id' => $post->id,
        'created_at' => now()->subDays(60),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats?days=7')
        ->assertSuccessful()
        ->assertJsonPath('days', 7)
        ->assertJsonPath('views', 3)
        ->assertJsonPath('top_posts.0.views', 3);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats?days=30')
        ->assertSuccessful()
        ->assertJsonPath('days', 30)
        ->assertJsonPath('views', 7);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats?days=90')
        ->assertSuccessful()
        ->assertJsonPath('days', 90)
        ->assertJsonPath('views', 12);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats?days=999')
        ->assertSuccessful()
        ->assertJsonPath('days', 30);

    Carbon::setTestNow();
});
