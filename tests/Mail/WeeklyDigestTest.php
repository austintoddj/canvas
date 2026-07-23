<?php

use Canvas\Mail\WeeklyDigest;
use Illuminate\Contracts\Queue\ShouldQueue;

it('can be instantiated', function (): void {
    $mailable = new WeeklyDigest(
        userName: 'Todd Sparkman',
        posts: [],
        totals: ['views' => 0, 'visits' => 0],
        startDate: now()->format('M j'),
        endDate: now()->addWeek()->format('M j'),
        timezone: 'UTC',
    );

    $this->assertInstanceOf(WeeklyDigest::class, $mailable);
});

it('is queued', function (): void {
    expect(new WeeklyDigest(
        userName: 'Todd',
        posts: [],
        totals: ['views' => 1, 'visits' => 1],
        startDate: 'Jun 22',
        endDate: 'Jun 29',
    ))->toBeInstanceOf(ShouldQueue::class);
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

    $mailable->assertHasSubject(__('canvas::app.digest.subject', [
        'start' => $startDate,
        'end' => $endDate,
    ]));
});

it('contains the recipient name, stats, dashboard cta, and sign-off', function (): void {
    config(['canvas.path' => 'canvas']);

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
        ->assertSeeInHtml(__('canvas::app.see_all_stats'))
        ->assertSeeInHtml(__('canvas::app.digest.thanks'))
        ->assertSeeInHtml(url('canvas'))
        ->assertDontSeeInHtml(url('canvas/stats'));
});

it('renders untitled posts when the title is empty', function (): void {
    $mailable = new WeeklyDigest(
        userName: 'Todd Sparkman',
        posts: [[
            'id' => 'post-1',
            'title' => '',
            'summary' => null,
            'views_count' => 3,
            'visits_count' => 1,
            'read_time' => '1 min read',
        ]],
        totals: ['views' => 3, 'visits' => 1],
        startDate: 'Jun 22',
        endDate: 'Jun 29',
    );

    $mailable->assertSeeInHtml(__('canvas::app.editor.untitled_post'));
});
