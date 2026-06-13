<?php

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Illuminate\Support\Facades\Mail;

it('digest command will send an email to users with mail enabled', function (): void {
    Mail::fake();

    $user = User::factory()->create([
        'digest' => 1,
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
        $this->assertArrayHasKey('posts', $mail->data);
        $this->assertIsArray($mail->data['posts']);

        $this->assertArrayHasKey('views_count', $mail->data['posts'][0]);
        $this->assertArrayHasKey('visits_count', $mail->data['posts'][0]);

        $this->assertArrayHasKey('totals', $mail->data);
        $this->assertSame(4, $mail->data['totals']['views']);
        $this->assertSame(2, $mail->data['totals']['visits']);

        $this->assertArrayHasKey('startDate', $mail->data);
        $this->assertArrayHasKey('endDate', $mail->data);
        $this->assertArrayHasKey('locale', $mail->data);

        return $mail->hasTo($user->email);
    });
});
it('digest command will not send an email to users with mail disabled', function (): void {
    Mail::fake();

    $user = User::factory()->create([
        'digest' => 0,
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
