<?php

namespace Canvas\Tests\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Models\Visit;
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

    public function testDigestCommandWillSendAnEmailToUsersThatHaveEnabledNotifications(): void
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'digest' => 1,
        ]);

        $posts = factory(Post::class, 2)->create([
            'user_id' => $user->id,
            'published_at' => now()->subWeek(),
        ]);

        foreach ($posts as $post) {
            $post->views()->createMany(
                factory(View::class, 2)->make()->toArray()
            );

            $post->visits()->createMany(
                factory(Visit::class, 1)->make()->toArray()
            );
        }

        $this->artisan('canvas:digest');

        Mail::assertSent(WeeklyDigest::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function testDigestCommandWillNotSendAnEmailToUsersThatHaveDisabledNotifications(): void
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'digest' => 0,
        ]);

        factory(Post::class, 2)->create([
            'user_id' => $user->id,
            'published_at' => now()->subWeek(),
        ]);

        $this->artisan('canvas:digest');

        Mail::assertNothingSent();
    }

    public function testDigestCommandWillSendAccurateTotalViewCounts(): void
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'digest' => 1,
        ]);

        $posts = factory(Post::class, 2)->create([
            'user_id' => $user->id,
            'published_at' => now()->subWeek(),
        ]);

        foreach ($posts as $post) {
            $post->views()->createMany(
                factory(View::class, 5)->make()->toArray()
            );
        }

        $this->artisan('canvas:digest');

        Mail::assertSent(WeeklyDigest::class, function ($mail) use ($user) {
            $this->assertArrayHasKey('totals', $mail->data);
            $this->assertArrayHasKey('views_count', $mail->data['posts'][0]);
            $this->assertSame(10, $mail->data['totals']['views']);

            return $mail->hasTo($user->email);
        });
    }

    public function testDigestCommandWillSendAccurateTotalVisitCounts(): void
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'digest' => 1,
        ]);

        $posts = factory(Post::class, 2)->create([
            'user_id' => $user->id,
            'published_at' => now()->subWeek(),
        ]);

        foreach ($posts as $post) {
            $post->visits()->createMany(
                factory(Visit::class, 5)->make()->toArray()
            );
        }

        $this->artisan('canvas:digest');

        Mail::assertSent(WeeklyDigest::class, function ($mail) use ($user) {
            $this->assertArrayHasKey('totals', $mail->data);
            $this->assertArrayHasKey('visits_count', $mail->data['posts'][0]);
            $this->assertSame(10, $mail->data['totals']['visits']);

            return $mail->hasTo($user->email);
        });
    }

    public function testDigestCommandWillSendPublishedContentData(): void
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'digest' => 1,
        ]);

        $posts = factory(Post::class, 2)->create([
            'user_id' => $user->id,
            'published_at' => now()->subWeek(),
        ]);

        foreach ($posts as $post) {
            $post->visits()->createMany(
                factory(Visit::class, 5)->make()->toArray()
            );
        }

        $this->artisan('canvas:digest');

        Mail::assertSent(WeeklyDigest::class, function ($mail) use ($user) {
            $this->assertArrayHasKey('posts', $mail->data);
            $this->assertIsArray($mail->data['posts']);

            return $mail->hasTo($user->email);
        });
    }

    public function testDigestCommandWillSendDateRangeAndLocale(): void
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'digest' => 1,
        ]);

        $posts = factory(Post::class, 2)->create([
            'user_id' => $user->id,
            'published_at' => now()->subWeek(),
        ]);

        foreach ($posts as $post) {
            $post->visits()->createMany(
                factory(Visit::class, 5)->make()->toArray()
            );
        }

        $this->artisan('canvas:digest');

        Mail::assertSent(WeeklyDigest::class, function ($mail) use ($user) {
            $this->assertArrayHasKey('startDate', $mail->data);
            $this->assertArrayHasKey('endDate', $mail->data);
            $this->assertArrayHasKey('locale', $mail->data);

            return $mail->hasTo($user->email);
        });
    }
}
