<?php

use Canvas\Analytics\PostInsights;
use Canvas\Models\Post;

it('returns empty analytics when a post has no views or visits', function (): void {
    $post = Post::factory()->create([
        'body' => null,
        'published_at' => now()->subWeek(),
    ]);

    $insights = PostInsights::for($post);

    expect($insights->monthlyViews)->toBe(0)
        ->and($insights->totalViews)->toBe(0)
        ->and($insights->monthlyVisits)->toBe(0)
        ->and($insights->popularReadingTimes)->toBe([])
        ->and($insights->topReferers)->toBe([])
        ->and($insights->topBrowsers)->toBe([])
        ->and($insights->monthOverMonthViews)->toBe([
            'direction' => 'down',
            'percentage' => '0',
        ])
        ->and($insights->monthOverMonthVisits)->toBe([
            'direction' => 'down',
            'percentage' => '0',
        ]);
});

it('serializes empty analytics for api responses', function (): void {
    $post = Post::factory()->create(['body' => 'Short body copy.']);

    $payload = PostInsights::for($post)->jsonSerialize();

    expect($payload)->toHaveKeys([
        'post',
        'readTime',
        'popularReadingTimes',
        'topReferers',
        'topBrowsers',
        'monthlyViews',
        'totalViews',
        'monthlyVisits',
        'monthOverMonthViews',
        'monthOverMonthVisits',
        'graph',
    ])
        ->and($payload['monthlyViews'])->toBe(0)
        ->and($payload['graph']['views'])->toBeString()
        ->and($payload['graph']['visits'])->toBeString();
});
