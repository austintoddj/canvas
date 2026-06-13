<?php

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;

it('instantiation', function (): void {
    $data = [
        'posts' => Post::all()->toArray(),
        'totals' => [
            'views' => Post::all()->sum('views_count'),
            'visits' => Post::all()->sum('visits_count'),
        ],
        'startDate' => now()->format('M j'),
        'endDate' => now()->addWeek()->format('M j'),
        'locale' => config('app.locale'),
    ];

    $mailable = new WeeklyDigest($data);

    $this->assertInstanceOf(WeeklyDigest::class, $mailable->build());
});
