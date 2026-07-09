<?php

use Canvas\Enums\Role;
use Canvas\Mail\WeeklyDigest;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\Models\BareUser;
use Canvas\Tests\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

it('sends digest emails to users with mail enabled', function (): void {
    Mail::fake();

    $user = User::factory()->create([
    ]);

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'theme' => null,
        'digest' => true,
        'locale' => 'en',
        'timezone' => 'UTC',
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
        $this->assertSame('UTC', $mail->timezone);

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
        'theme' => null,
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

it('uses the recipients timezone for digest periods and stats windows', function (): void {
    Mail::fake();

    Carbon::setTestNow(Carbon::parse('2026-06-29 18:00:00', 'America/Chicago'));

    $user = User::factory()->create();

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'digest' => true,
        'locale' => 'en',
        'timezone' => 'America/Chicago',
    ]);

    $post = Post::factory()->create([
        'user_id' => $user->id,
        'published_at' => now()->subWeek(),
    ]);

    $post->views()->create([
        'created_at' => Carbon::parse('2026-06-22 05:30:00', 'UTC'),
    ]);

    $post->views()->create([
        'created_at' => Carbon::parse('2026-06-22 04:30:00', 'UTC'),
    ]);

    $this->artisan('canvas:digest');

    Mail::assertSent(WeeklyDigest::class, function (WeeklyDigest $mail) use ($user) {
        expect($mail->startDate)->toBe('Jun 22');
        expect($mail->endDate)->toBe('Jun 29');
        expect($mail->timezone)->toBe('America/Chicago');
        expect($mail->totals['views'])->toBe(1);

        return $mail->hasTo($user->email);
    });
});

// Invariant: digest is a core package path and must not require HasCanvasAccess / canvasUser on the host model
it('sends digest emails for bare host users without canvas relations', function (): void {
    Mail::fake();

    config()->set('canvas.user_model', BareUser::class);

    $host = User::factory()->create([
        'name' => 'Bare Digest Author',
        'email' => 'bare-digest@example.com',
    ]);

    CanvasUser::factory()->create([
        'user_id' => $host->id,
        'role' => Role::Contributor,
        'digest' => true,
        'locale' => 'en',
        'timezone' => 'UTC',
    ]);

    $posts = Post::factory()->count(2)->create([
        'user_id' => $host->id,
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

    $this->artisan('canvas:digest')->assertSuccessful();

    Mail::assertSent(WeeklyDigest::class, function (WeeklyDigest $mail) use ($host): bool {
        expect($mail->userName)->toBe('Bare Digest Author');
        expect($mail->totals['views'])->toBe(4);
        expect($mail->totals['visits'])->toBe(2);

        return $mail->hasTo($host->email);
    });
});
