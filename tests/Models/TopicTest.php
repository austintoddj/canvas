<?php

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

it('allows topics to share the same slug across different users', function (): void {
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

    $secondaryAdmin = User::factory()->admin()->create();
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
it('defines the posts relationship', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create(['topic_id' => $topic->id]);

    $this->assertInstanceOf(HasMany::class, $topic->posts());
    $this->assertInstanceOf(Post::class, $topic->posts->first());
});
it('defines the user relationship', function (): void {
    $topic = Topic::factory()->create();

    $this->assertInstanceOf(BelongsTo::class, $topic->user());
    $this->assertInstanceOf(User::class, $topic->user);
});
it('detaches posts on delete', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create(['topic_id' => $topic->id]);

    $this->assertInstanceOf(Post::class, $topic->posts->first());

    $topic->delete();

    $this->assertEquals(0, $topic->fresh()->posts->count());
    $this->assertDatabaseHas('canvas_posts', [
        'id' => $post->id,
        'topic_id' => null,
    ]);
});
