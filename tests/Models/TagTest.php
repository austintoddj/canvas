<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

it('allows tags to share the same slug across different users', function (): void {
    $data = [
        'name' => 'A new tag',
        'slug' => 'a-new-tag',
    ];

    $primaryTag = Tag::factory()->create([
        'user_id' => $this->admin->id,
    ]);
    $response = $this->actingAs($this->admin, 'canvas')->postJson("/canvas/api/tags/{$primaryTag->id}", $data);

    $this->assertDatabaseHas('canvas_tags', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);

    $secondaryAdmin = User::factory()->admin()->create();
    $secondaryTag = Tag::factory()->create([
        'user_id' => $secondaryAdmin->id,
    ]);

    $response = $this->actingAs($secondaryAdmin, 'canvas')->postJson("/canvas/api/tags/{$secondaryTag->id}", $data);

    $this->assertDatabaseHas('canvas_tags', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);
});
it('defines the posts relationship', function (): void {
    $tag = Tag::factory()->create();
    $post = Post::factory()->create();

    $post->tags()->sync($tag);

    $this->assertCount(1, $post->tags);
    $this->assertInstanceOf(BelongsToMany::class, $tag->posts());
    $this->assertInstanceOf(Post::class, $tag->posts->first());
});
it('defines the user relationship', function (): void {
    $tag = Tag::factory()->create();

    $this->assertInstanceOf(BelongsTo::class, $tag->user());
    $this->assertInstanceOf(User::class, $tag->user);
});
it('detaches posts on delete', function (): void {
    $tag = Tag::factory()->create();
    $post = Post::factory()->create();

    $tag->posts()->sync([$post->id]);

    $tag->delete();

    $this->assertEquals(0, $tag->posts->count());
    $this->assertDatabaseMissing('canvas_posts_tags', [
        'post_id' => $post->id,
        'tag_id' => $tag->id,
    ]);
});
