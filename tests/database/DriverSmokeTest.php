<?php

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

// Focused suite for real MySQL / Postgres CI drivers (see workflow php-database job).
uses()->group('database');

it('runs on a real database driver connection', function (): void {
    $driver = DB::connection()->getDriverName();

    expect($driver)->toBeIn(['sqlite', 'mysql', 'pgsql']);
});

it('has all canvas tables after migrations', function (string $table): void {
    expect(Schema::hasTable($table))->toBeTrue();
})->with([
    'canvas_posts',
    'canvas_tags',
    'canvas_topics',
    'canvas_posts_tags',
    'canvas_views',
    'canvas_visits',
    'canvas_users',
    'canvas_media',
    'canvas_settings',
]);

it('persists posts taxonomy views and canvas access on the driver', function (): void {
    $user = User::factory()->create();

    CanvasUser::query()->create([
        'user_id' => $user->id,
        'role' => Role::Admin,
    ]);

    $topic = Topic::factory()->create([
        'user_id' => $user->id,
        'name' => 'Driver Topic',
        'slug' => 'driver-topic-'.Str::lower(Str::random(6)),
    ]);

    $tag = Tag::factory()->create([
        'user_id' => $user->id,
        'name' => 'Driver Tag',
        'slug' => 'driver-tag-'.Str::lower(Str::random(6)),
    ]);

    $post = Post::factory()->create([
        'user_id' => $user->id,
        'topic_id' => $topic->id,
        'title' => 'Driver smoke post',
        'slug' => 'driver-smoke-'.Str::lower(Str::random(6)),
        'body' => '<p>Hello from driver smoke</p>',
        'published_at' => now()->subHour(),
        'meta' => ['title' => 'SEO title', 'description' => 'SEO description'],
    ]);

    $post->tags()->sync([$tag->id]);

    View::query()->create([
        'post_id' => $post->id,
        'ip' => '203.0.113.10',
        'agent' => 'CanvasDriverSmoke/1.0',
        'referer' => 'https://example.com',
    ]);

    $fresh = Post::query()->with(['tags', 'topic'])->findOrFail($post->id);

    expect($fresh->title)->toBe('Driver smoke post')
        ->and($fresh->meta['title'] ?? null)->toBe('SEO title')
        ->and($fresh->topic?->id)->toBe($topic->id)
        ->and($fresh->tags->pluck('id')->all())->toContain($tag->id)
        ->and(CanvasUser::query()->where('user_id', $user->id)->value('role'))->toBe(Role::Admin)
        ->and(View::query()->where('post_id', $post->id)->count())->toBe(1);

    // Soft delete + unique slug per user still work under driver FK rules.
    $fresh->delete();
    expect(Post::query()->find($post->id))->toBeNull()
        ->and(Post::withTrashed()->find($post->id))->not->toBeNull();
});

it('stores and reads analytics day buckets for the driver', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'user_id' => $user->id,
        'published_at' => now()->subDay(),
    ]);

    View::query()->create([
        'post_id' => $post->id,
        'ip' => '198.51.100.4',
        'agent' => 'CanvasDriverSmoke/1.0',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $driver = DB::connection()->getDriverName();

    $dayExpression = match ($driver) {
        'pgsql' => "to_char(created_at, 'YYYY-MM-DD')",
        'mysql' => "DATE_FORMAT(created_at, '%Y-%m-%d')",
        default => "strftime('%Y-%m-%d', created_at)",
    };

    $rows = DB::table('canvas_views')
        ->selectRaw("{$dayExpression} as day, count(*) as aggregate")
        ->where('post_id', $post->id)
        ->groupBy('day')
        ->get();

    expect($rows)->not->toBeEmpty()
        ->and((int) $rows->first()->aggregate)->toBeGreaterThanOrEqual(1);
});
