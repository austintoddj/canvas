<?php

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;

it('can be instantiated', function (): void {
    $mailable = new WeeklyDigest(
        posts: Post::all()->toArray(),
        totals: ['views' => 0, 'visits' => 0],
        startDate: now()->format('M j'),
        endDate: now()->addWeek()->format('M j'),
        locale: config('app.locale'),
    );

    $this->assertInstanceOf(WeeklyDigest::class, $mailable);
});
