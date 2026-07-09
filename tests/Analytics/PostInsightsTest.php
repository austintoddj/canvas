<?php

use Canvas\Analytics\PostInsights;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Illuminate\Support\Carbon;

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

it('computes popular reading times and browser breakdowns from monthly views', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

    $post = Post::factory()->create([
        'published_at' => now()->subWeek(),
        'body' => str_repeat('word ', 250),
    ]);

    $agents = [
        'Mozilla/5.0 Edg/120.0',
        'Mozilla/5.0 Chrome/120.0',
        'Mozilla/5.0 Firefox/120.0',
        'Mozilla/5.0 Safari/605.1',
        'Mozilla/5.0 OPR/90.0',
    ];

    foreach ($agents as $index => $agent) {
        View::factory()->create([
            'post_id' => $post->id,
            'agent' => $agent,
            'referer' => $index === 0 ? null : 'https://news.example.com',
            'created_at' => now()->startOfMonth()->addHours($index),
        ]);
    }

    $insights = PostInsights::for($post, 'en');
    $other = trans('canvas::app.other', [], 'en');

    expect($insights->monthlyViews)->toBe(5)
        ->and($insights->totalViews)->toBe(5)
        ->and($insights->popularReadingTimes)->not->toBeEmpty()
        ->and($insights->topBrowsers)->toHaveKey('Edge')
        ->and($insights->topBrowsers)->toHaveKey('Chrome')
        ->and($insights->topBrowsers)->toHaveKey('Firefox')
        ->and($insights->topBrowsers)->toHaveKey('Safari')
        ->and($insights->topBrowsers)->toHaveKey('Opera')
        ->and($insights->topReferers)->toHaveKey($other)
        ->and($insights->topReferers)->toHaveKey('https://news.example.com');

    Carbon::setTestNow();
});

it('counts monthly activity with sql aggregates across month boundaries', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));

    $post = Post::factory()->create([
        'published_at' => now()->subMonths(2),
    ]);

    View::factory()->count(2)->create([
        'post_id' => $post->id,
        'created_at' => now()->startOfMonth()->addDay(),
    ]);

    View::factory()->count(3)->create([
        'post_id' => $post->id,
        'created_at' => now()->subMonthNoOverflow()->startOfMonth()->addDay(),
    ]);

    Visit::factory()->count(4)->create([
        'post_id' => $post->id,
        'created_at' => now()->startOfMonth()->addDays(2),
    ]);

    $insights = PostInsights::for($post);

    expect($insights->monthlyViews)->toBe(2)
        ->and($insights->totalViews)->toBe(5)
        ->and($insights->monthlyVisits)->toBe(4)
        ->and($insights->monthOverMonthViews['direction'])->toBe('down')
        ->and($insights->monthOverMonthVisits['direction'])->toBe('up');

    Carbon::setTestNow();
});

it('classifies browser agents including empty and unknown values', function (): void {
    $method = new ReflectionMethod(PostInsights::class, 'parseBrowser');
    $method->setAccessible(true);

    $other = trans('canvas::app.other', [], 'en');

    expect($method->invoke(null, null, 'en'))->toBe($other)
        ->and($method->invoke(null, 'Mozilla/5.0 Edg/120.0', 'en'))->toBe('Edge')
        ->and($method->invoke(null, 'Mozilla/5.0 Chrome/120.0', 'en'))->toBe('Chrome')
        ->and($method->invoke(null, 'Mozilla/5.0 Firefox/120.0', 'en'))->toBe('Firefox')
        ->and($method->invoke(null, 'Mozilla/5.0 Safari/605.1', 'en'))->toBe('Safari')
        ->and($method->invoke(null, 'Mozilla/5.0 OPR/90.0', 'en'))->toBe('Opera')
        ->and($method->invoke(null, 'Opera/9.80', 'en'))->toBe('Opera')
        ->and($method->invoke(null, 'CustomBot/1.0', 'en'))->toBe($other);
});
