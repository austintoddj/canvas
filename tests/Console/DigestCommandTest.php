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

    $user = User::factory()->create();

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

    Mail::assertQueued(WeeklyDigest::class, function ($mail) use ($user) {
        $this->assertIsArray($mail->posts);
        $this->assertArrayHasKey('views_count', $mail->posts[0]);
        $this->assertArrayHasKey('visits_count', $mail->posts[0]);
        $this->assertArrayHasKey('read_time', $mail->posts[0]);

        $this->assertSame(4, $mail->totals['views']);
        $this->assertSame(2, $mail->totals['visits']);

        $this->assertNotEmpty($mail->startDate);
        $this->assertNotEmpty($mail->endDate);
        $this->assertSame('UTC', $mail->timezone);

        return $mail->hasTo($user->email);
    });
});

it('does not send digest emails to users with mail disabled', function (): void {
    Mail::fake();

    $user = User::factory()->create();

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

    Mail::assertNothingOutgoing();
});

it('does not send when the week had no views or visitors', function (): void {
    Mail::fake();

    $user = User::factory()->create();

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'digest' => true,
        'locale' => 'en',
        'timezone' => 'UTC',
    ]);

    Post::factory()->create([
        'user_id' => $user->id,
        'published_at' => now()->subWeek(),
    ]);

    $this->artisan('canvas:digest')->assertSuccessful();

    Mail::assertNothingOutgoing();
});

it('only includes posts with activity and caps the list', function (): void {
    Mail::fake();

    $user = User::factory()->create();

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'digest' => true,
        'locale' => 'en',
        'timezone' => 'UTC',
    ]);

    $active = Post::factory()->count(12)->create([
        'user_id' => $user->id,
        'published_at' => now()->subWeek(),
    ]);

    foreach ($active as $index => $post) {
        $post->views()->createMany(
            View::factory()->count($index + 1)->make()->toArray()
        );
    }

    Post::factory()->create([
        'user_id' => $user->id,
        'title' => 'Quiet post',
        'published_at' => now()->subWeek(),
    ]);

    $this->artisan('canvas:digest');

    Mail::assertQueued(WeeklyDigest::class, function (WeeklyDigest $mail) use ($user): bool {
        expect($mail->posts)->toHaveCount(10);
        expect(collect($mail->posts)->pluck('title'))->not->toContain('Quiet post');
        expect($mail->totals['views'])->toBe(array_sum(range(1, 12)));

        return $mail->hasTo($user->email);
    });
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

    Mail::assertQueued(WeeklyDigest::class, function (WeeklyDigest $mail) use ($user) {
        expect($mail->startDate)->toBe('Jun 22');
        expect($mail->endDate)->toBe('Jun 29');
        expect($mail->timezone)->toBe('America/Chicago');
        expect($mail->totals['views'])->toBe(1);

        return $mail->hasTo($user->email);
    });
});

it('exits successfully when there are no published authors', function (): void {
    Mail::fake();

    Post::factory()->create([
        'user_id' => null,
        'published_at' => now()->subWeek(),
    ]);

    $this->artisan('canvas:digest')->assertSuccessful();

    Mail::assertNothingOutgoing();
});

it('skips digest recipients without a host user or complete contact details', function (): void {
    Mail::fake();

    $softDeletedHost = User::factory()->create([
        'name' => 'Gone Author',
        'email' => 'gone@example.com',
    ]);
    $blankContact = User::factory()->create([
        'name' => '',
        'email' => 'blank-contact@example.com',
    ]);

    foreach ([$softDeletedHost, $blankContact] as $host) {
        CanvasUser::factory()->create([
            'user_id' => $host->id,
            'role' => Role::Contributor,
            'digest' => true,
            'locale' => 'en',
            'timezone' => 'UTC',
        ]);

        $post = Post::factory()->create([
            'user_id' => $host->id,
            'published_at' => now()->subWeek(),
        ]);

        $post->views()->createMany(
            View::factory()->count(2)->make()->toArray()
        );
    }

    $softDeletedHost->delete();

    $this->artisan('canvas:digest')->assertSuccessful();

    Mail::assertNothingOutgoing();
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

    Mail::assertQueued(WeeklyDigest::class, function (WeeklyDigest $mail) use ($host): bool {
        expect($mail->userName)->toBe('Bare Digest Author');
        expect($mail->totals['views'])->toBe(4);
        expect($mail->totals['visits'])->toBe(2);

        return $mail->hasTo($host->email);
    });
});
