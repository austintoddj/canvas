<?php

namespace Canvas\Tests\Mail;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class WeeklyDigestTest.
 *
 * @covers \Canvas\Mail\WeeklyDigest
 */
class WeeklyDigestTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_build_a_mailable()
    {
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
    }
}
