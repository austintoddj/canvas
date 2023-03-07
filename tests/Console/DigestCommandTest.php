<?php

namespace Canvas\Tests\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

/**
 * Class DigestCommandTest.
 *
 * @covers \Canvas\Console\DigestCommand
 */
class DigestCommandTest extends TestCase
{
    use RefreshDatabase;

    public function testDigestCommandWillSendAnEmailToUsersWithMailEnabled(): void
    {
        Mail::fake();

        $post = Post::factory()
            ->forUser([
                'digest' => 1,
            ])
            ->published()
            ->hasViews(2)
            ->hasVisits(1)
            ->create();

        $this->artisan('canvas:digest');

        Mail::assertSent(WeeklyDigest::class, function ($mail) use ($post) {
            $this->assertArrayHasKey('posts', $mail->data);
            $this->assertIsArray($mail->data['posts']);

            $this->assertArrayHasKey('views_count', $mail->data['posts'][0]);
            $this->assertArrayHasKey('visits_count', $mail->data['posts'][0]);

            $this->assertArrayHasKey('totals', $mail->data);
            $this->assertSame(2, $mail->data['totals']['views']);
            $this->assertSame(1, $mail->data['totals']['visits']);

            $this->assertArrayHasKey('startDate', $mail->data);
            $this->assertArrayHasKey('endDate', $mail->data);
            $this->assertArrayHasKey('locale', $mail->data);

            return $mail->hasTo($post->user->email);
        });
    }

    public function testDigestCommandWillNotSendAnEmailToUsersWithMailDisabled(): void
    {
        Mail::fake();

        $post = Post::factory()
            ->forUser([
                'digest' => 0,
            ])
            ->published()
            ->hasViews(2)
            ->hasVisits(1)
            ->create();

        $this->artisan('canvas:digest');

        Mail::assertNothingSent();
    }
}
