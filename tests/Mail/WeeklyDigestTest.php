<?php

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;

it('can be instantiated', function (): void {
    $mailable = new WeeklyDigest(
        userName: 'Todd Sparkman',
        posts: Post::all()->toArray(),
        totals: ['views' => 0, 'visits' => 0],
        startDate: now()->format('M j'),
        endDate: now()->addWeek()->format('M j'),
        timezone: 'UTC',
    );

    $this->assertInstanceOf(WeeklyDigest::class, $mailable);
});

it('has the expected subject', function (): void {
    $startDate = now()->format('M j');
    $endDate = now()->addWeek()->format('M j');

    $mailable = new WeeklyDigest(
        userName: 'Todd Sparkman',
        posts: [],
        totals: ['views' => 0, 'visits' => 0],
        startDate: $startDate,
        endDate: $endDate,
    );

    $mailable->assertHasSubject(sprintf('%s: %s - %s',
        __('canvas::app.stats_for_your_posts'),
        $startDate,
        $endDate,
    ));
});

it('contains the recipient name and stats in the rendered email', function (): void {
    $mailable = new WeeklyDigest(
        userName: 'Todd Sparkman',
        posts: [],
        totals: ['views' => 42, 'visits' => 18],
        startDate: now()->format('M j'),
        endDate: now()->addWeek()->format('M j'),
    );

    $mailable
        ->assertSeeInHtml('Todd Sparkman')
        ->assertSeeInHtml('42')
        ->assertSeeInHtml('18')
        ->assertSeeInHtml(__('canvas::app.see_all_stats'));
});
