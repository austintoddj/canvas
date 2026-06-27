<?php

use Canvas\Enums\Role;
use Canvas\Mail\WeeklyDigest;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Mail;

it('sends digest emails to users with mail enabled', function (): void {
    Mail::fake();

    $user = User::factory()->create([
    ]);

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'dark_mode' => false,
        'digest' => true,
    ]);

    $posts = Post::factory()->count(2)->create([
        'user_id' => $user->id,
        'published_at' => now()->subWeek(),
    ]);

    foreach ($posts as $post) {
        $post->views()->createMany(
            View::factory()->count(2)->make()->toArray()
        );

        $post->visits()->createMany(
            Visit::factory()->count(1)->make()->toArray()
        );
    }

    $this->artisan('canvas:digest');

    Mail::assertSent(WeeklyDigest::class, function ($mail) use ($user) {
        $this->assertIsArray($mail->posts);
        $this->assertArrayHasKey('views_count', $mail->posts[0]);
        $this->assertArrayHasKey('visits_count', $mail->posts[0]);

        $this->assertSame(4, $mail->totals['views']);
        $this->assertSame(2, $mail->totals['visits']);

        $this->assertNotEmpty($mail->startDate);
        $this->assertNotEmpty($mail->endDate);
        $this->assertNotEmpty($mail->locale);

        return $mail->hasTo($user->email);
    });
});
it('does not send digest emails to users with mail disabled', function (): void {
    Mail::fake();

    $user = User::factory()->create([
    ]);

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'dark_mode' => false,
        'digest' => false,
    ]);

    $posts = Post::factory()->count(2)->create([
        'user_id' => $user->id,
        'published_at' => now()->subWeek(),
    ]);

    foreach ($posts as $post) {
        $post->views()->createMany(
            View::factory()->count(2)->make()->toArray()
        );

        $post->visits()->createMany(
            Visit::factory()->count(1)->make()->toArray()
        );
    }

    $this->artisan('canvas:digest');

    Mail::assertNothingSent();
});
