<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
it('casts dates to Carbon objects', function (): void {
    $this->assertInstanceOf(Carbon::class, Post::factory()->create()->published_at);
});
it('meta is cast to array', function (): void {
    $this->assertIsArray(Post::factory()->create()->meta);
});
it('computes the published attribute', function (): void {
    $this->assertTrue(Post::factory()->create([
        'published_at' => now()->subDay(),
    ])->published);
});
it('allows posts to share the same slug across different users', function (): void {
    $data = [
        'slug' => 'a-new-post',
        'title' => 'A new post',
    ];

    $primaryPost = Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);
    $response = $this->actingAs($this->admin, 'canvas')->postJson("/canvas/api/posts/{$primaryPost->id}", $data);

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);

    $secondaryPost = Post::factory()->create([
        'user_id' => $this->editor->id,
    ]);
    $response = $this->actingAs($this->editor, 'canvas')->postJson("/canvas/api/posts/{$secondaryPost->id}", $data);

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);
});
it('defines the tags relationship', function (): void {
    $post = Post::factory()->create();
    $tag = Tag::factory()->create();

    $post->tags()->sync($tag);

    $this->assertInstanceOf(BelongsToMany::class, $post->tags());
    $this->assertInstanceOf(Tag::class, $post->tags->first());
});
it('defines the topic relationship', function (): void {
    $post = Post::factory()->create();
    $topic = Topic::factory()->create();

    $post->update(['topic_id' => $topic->id]);

    $this->assertInstanceOf(BelongsTo::class, $post->topic());
    $this->assertInstanceOf(Topic::class, $post->topic);
});
it('defines the user relationship', function (): void {
    $post = Post::factory()->create();

    $this->assertInstanceOf(BelongsTo::class, $post->user());
    $this->assertInstanceOf(User::class, $post->user);
});
it('defines the views relationship', function (): void {
    $post = Post::factory()->create();

    View::factory()->create([
        'post_id' => $post->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $post->views());
    $this->assertInstanceOf(View::class, $post->views->first());
});
it('defines the visits relationship', function (): void {
    $post = Post::factory()->create();

    Visit::factory()->create([
        'post_id' => $post->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $post->visits());
    $this->assertInstanceOf(Visit::class, $post->visits->first());
});
it('applies the published scope', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $this->assertInstanceOf(Builder::class, resolve(Post::class)->published());
    $this->assertCount(1, Post::published()->get());
});
it('applies the draft scope', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->addDay(),
    ]);

    $this->assertInstanceOf(Builder::class, resolve(Post::class)->draft());
    $this->assertCount(1, Post::draft()->get());
});
it('detaches taxonomy on delete', function (): void {
    $tag = Tag::factory()->create();
    $topic = Topic::factory()->create();
    $post = Post::factory()->create(['topic_id' => $topic->id]);

    $post->tags()->sync([$tag->id]);

    $post->delete();

    $this->assertEquals(0, $post->tags->count());
    $this->assertDatabaseMissing('canvas_posts_tags', [
        'post_id' => $post->id,
        'tag_id' => $tag->id,
    ]);
});
