<?php

use Canvas\Analytics\DashboardInsights;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

it('returns empty dashboard analytics for an empty post collection', function (): void {
    $insights = DashboardInsights::for(collect());

    expect($insights->views)->toBe(0)
        ->and($insights->visits)->toBe(0)
        ->and($insights->graph)->toHaveKeys(['views', 'visits'])
        ->and($insights->topReferers)->toBe([])
        ->and($insights->monthOverMonthViews)->toMatchArray([
            'direction' => 'down',
            'percentage' => '0',
        ]);
});

it('returns empty dashboard analytics when posts have no tracked activity', function (): void {
    $postIds = Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
    ])->pluck('id');

    $insights = DashboardInsights::for($postIds);

    expect($insights->views)->toBe(0)
        ->and($insights->visits)->toBe(0)
        ->and($insights->topReferers)->toBe([]);
});

it('serializes empty dashboard analytics for api responses', function (): void {
    $insights = DashboardInsights::for(collect());

    expect($insights->jsonSerialize())->toBe([
        'views' => 0,
        'visits' => 0,
        'graph' => $insights->graph,
        'monthOverMonthViews' => $insights->monthOverMonthViews,
        'monthOverMonthVisits' => $insights->monthOverMonthVisits,
        'topReferers' => [],
    ]);
});

it('aggregates views and visits in sql without hydrating view rows', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

    $posts = Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subWeek(),
    ]);

    foreach ($posts as $post) {
        View::factory()->count(3)->create([
            'post_id' => $post->id,
            'created_at' => now()->subDays(2),
            'referer' => 'https://example.com',
        ]);

        Visit::factory()->count(2)->create([
            'post_id' => $post->id,
            'created_at' => now()->subDays(1),
        ]);
    }

    View::factory()->count(4)->create([
        'post_id' => $posts->first()->id,
        'created_at' => now()->subDays(40),
        'referer' => 'https://old.example.com',
    ]);

    $hydrated = 0;
    DB::listen(function ($query) use (&$hydrated): void {
        if (str_contains(strtolower($query->sql), 'select')
            && str_contains($query->sql, 'canvas_views')
            && ! str_contains(strtolower($query->sql), 'count(')
            && ! str_contains(strtolower($query->sql), 'group by')) {
            $hydrated++;
        }
    });

    $insights = DashboardInsights::for($posts->pluck('id'), 30);

    expect($insights->views)->toBe(6)
        ->and($insights->visits)->toBe(4)
        ->and(json_decode($insights->graph['views'], true))->toBeArray()
        ->and($hydrated)->toBe(0)
        ->and($insights->topReferers)->toHaveKey('https://example.com')
        ->and($insights->monthOverMonthViews)->toMatchArray([
            'direction' => 'up',
            'percentage' => '50',
        ]);

    Carbon::setTestNow();
});

it('computes growth when the prior period is quieter', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subMonths(2),
    ]);

    View::factory()->count(2)->create([
        'post_id' => $post->id,
        'created_at' => now()->subDays(45),
    ]);

    View::factory()->count(6)->create([
        'post_id' => $post->id,
        'created_at' => now()->subDays(3),
    ]);

    $insights = DashboardInsights::for(collect([$post->id]), 30);

    expect($insights->views)->toBe(6)
        ->and($insights->monthOverMonthViews)->toMatchArray([
            'direction' => 'up',
            'percentage' => '200',
        ]);

    Carbon::setTestNow();
});
