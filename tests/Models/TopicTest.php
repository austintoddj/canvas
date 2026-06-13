<?php

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

it('topics can share the same slug with unique users', function (): void {
    $data = [
        'name' => 'A new topic',
        'slug' => 'a-new-topic',
    ];

    $primaryTopic = Topic::factory()->create([
        'user_id' => $this->admin->id,
    ]);
    $response = $this->actingAs($this->admin, 'canvas')->postJson("/canvas/api/topics/{$primaryTopic->id}", $data);

    $this->assertDatabaseHas('canvas_topics', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);

    $secondaryAdmin = User::factory()->create([
        'role' => User::ADMIN,
    ]);
    $secondaryTopic = Topic::factory()->create([
        'user_id' => $secondaryAdmin->id,
    ]);

    $response = $this->actingAs($secondaryAdmin, 'canvas')->postJson("/canvas/api/topics/{$secondaryTopic->id}", $data);

    $this->assertDatabaseHas('canvas_topics', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);
});
it('posts relationship', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create();

    $post->topic()->sync($topic);

    $this->assertCount(1, $post->topic);
    $this->assertInstanceOf(BelongsToMany::class, $topic->posts());
    $this->assertInstanceOf(Post::class, $topic->posts->first());
});
it('user relationship', function (): void {
    $topic = Topic::factory()->create();

    $this->assertInstanceOf(BelongsTo::class, $topic->user());
    $this->assertInstanceOf(User::class, $topic->user);
});
it('detach posts on delete', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create();

    $topic->posts()->sync([$post->id]);

    $topic->delete();

    $this->assertEquals(0, $topic->posts->count());
    $this->assertDatabaseMissing('canvas_posts_topics', [
        'post_id' => $post->id,
        'topic_id' => $topic->id,
    ]);
});
