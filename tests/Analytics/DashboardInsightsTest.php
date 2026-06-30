<?php

use Canvas\Analytics\DashboardInsights;
use Canvas\Models\Post;

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
