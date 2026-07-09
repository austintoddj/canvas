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
        ->and($insights->graph)->toHaveKeys(['views', 'visits']);
});

it('returns empty dashboard analytics when posts have no tracked activity', function (): void {
    $postIds = Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
    ])->pluck('id');

    $insights = DashboardInsights::for($postIds);

    expect($insights->views)->toBe(0)
        ->and($insights->visits)->toBe(0);
});

it('serializes empty dashboard analytics for api responses', function (): void {
    $insights = DashboardInsights::for(collect());

    expect($insights->jsonSerialize())->toBe([
        'views' => 0,
        'visits' => 0,
        'graph' => $insights->graph,
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
        ]);

        Visit::factory()->count(2)->create([
            'post_id' => $post->id,
            'created_at' => now()->subDays(1),
        ]);
    }

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
        ->and($hydrated)->toBe(0);

    Carbon::setTestNow();
});
