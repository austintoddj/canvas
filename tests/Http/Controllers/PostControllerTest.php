<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class PostControllerTest.
 *
 * @covers \Canvas\Http\Controllers\PostController
 * @covers \Canvas\Http\Requests\PostRequest
 * @covers \Canvas\Canvas
 */
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testPublishedPostsAreFetchedByDefault(): void
    {
        $published = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $draft = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.index'))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $published->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'drafts_count' => $this->admin->posts()->draft()->count(),
                 'published_count' => $this->admin->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $draft->id,
             ]);
    }

    public function testPublishedPostsCanBeFetchedWithAGivenQueryType(): void
    {
        $published = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $draft = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['type' => 'published']))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $published->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'drafts_count' => $this->admin->posts()->draft()->count(),
                 'published_count' => $this->admin->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $draft->id,
             ]);
    }

    public function testDraftPostsCanBeFetchedWithAGivenQueryType(): void
    {
        $published = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $draft = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['type' => 'draft']))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $draft->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'drafts_count' => $this->admin->posts()->draft()->count(),
                 'published_count' => $this->admin->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $published->id,
             ]);
    }

    public function testUserPostsAreFetchedByDefault(): void
    {
        $byAdmin = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $byEditor = factory(Post::class)->create([
            'user_id' => $this->editor->id,
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.index'))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $byAdmin->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'drafts_count' => $this->admin->posts()->draft()->count(),
                 'published_count' => $this->admin->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $byEditor->id,
             ]);
    }

    public function testAllPostsCanBeFetchedWithAGivenQueryScope(): void
    {
        $byAdmin = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $byEditor = factory(Post::class)->create([
            'user_id' => $this->editor->id,
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['scope' => 'all']))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'total' => Post::all()->count(),
                 'drafts_count' => Post::draft()->count(),
                 'published_count' => Post::published()->count(),
             ])
            ->assertJsonFragment([
                'id' => $byAdmin->id,
            ])
            ->assertJsonFragment([
                'id' => $byEditor->id,
            ]);
    }

    public function testUserPostsCanBeFetchedWithAGivenQueryScope(): void
    {
        $byAdmin = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $byEditor = factory(Post::class)->create([
            'user_id' => $this->editor->id,
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['scope' => 'user']))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'total' => $this->admin->posts()->count(),
                 'drafts_count' => $this->admin->posts()->draft()->count(),
                 'published_count' => $this->admin->posts()->published()->count(),
             ])
             ->assertJsonFragment([
                 'id' => $byAdmin->id,
             ])
            ->assertJsonMissing([
                'id' => $byEditor->id,
            ]);
    }

    public function testNewPostData(): void
    {
        $response = $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.create'))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'post',
                 'tags',
                 'topics',
             ]);
    }

    public function testExistingPostData(): void
    {
        $post = factory(Post::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.show', ['id' => $post->id]))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'post',
                 'tags',
                 'topics',
             ])
             ->assertJsonFragment([
                 'id' => $post->id,
             ]);
    }

    public function testPostNotFound(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson(route('canvas.posts.show', ['id' => 'not-a-post']))
             ->assertNotFound();
    }

    public function testContributorAccessRestricted(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->contributor, 'canvas')
            ->getJson(route('canvas.posts.show', ['id' => $post->id]))
             ->assertNotFound();
    }

    public function testStoreNewPost(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
            'title' => 'A new post',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $data['id'],
                 'slug' => $data['slug'],
                 'title' => $data['title'],
                 'user_id' => $this->admin->id,
             ]);
    }

    public function testUpdateExistingPost(): void
    {
        $post = factory(Post::class)->create();

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);
    }

    public function testAContributorCanOnlyUpdateTheirOwnPost(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->contributor->id,
        ]);

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($this->contributor, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);
    }

    public function testSyncNewTags(): void
    {
        $post = factory(Post::class)->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'tags' => [
                [
                    'name' => 'A new tag',
                    'slug' => 'a-new-tag',
                ],
                [
                    'name' => 'Another tag',
                    'slug' => 'another-tag',
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);

        $this->assertCount(2, $post->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
        ]);
    }

    public function testSyncExistingTags(): void
    {
        $post = factory(Post::class)->create();
        $tag = factory(Tag::class)->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'tags' => [
                [
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);

        $this->assertCount(1, $post->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);
    }

    public function testSyncNewTopic(): void
    {
        $post = factory(Post::class)->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'topic' => [
                [
                    'name' => 'A new topic',
                    'slug' => 'a-new-topic',
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);

        $this->assertCount(1, $post->topic);
        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
        ]);
    }

    public function testSyncExistingTopic(): void
    {
        $post = factory(Post::class)->create();
        $topic = factory(Topic::class)->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'topic' => [
                [
                    'name' => $topic->name,
                    'slug' => $topic->slug,
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);

        $this->assertCount(1, $post->topic);
        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $post = factory(Post::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", [
                 'slug' => 'a new.slug',
             ])
             ->assertStatus(422)
             ->assertJsonStructure([
                 'errors' => [
                     'slug',
                 ],
             ]);
    }

    public function testDeleteExistingPost(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->editor->id,
            'slug' => 'a-new-post',
        ]);

        $this->actingAs($this->contributor, 'canvas')
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertNotFound();

        $this->actingAs($this->editor, 'canvas')
             ->deleteJson('canvas/api/posts/not-a-post')
             ->assertNotFound();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);
    }

    public function testDeSyncRelatedTaxonomy(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'slug' => 'a-new-post',
        ]);

        $tag = factory(Tag::class)->create();
        $post->tags()->sync([$tag->id]);

        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertCount(1, $post->tags);

        $topic = factory(Topic::class)->create();
        $post->topic()->sync([$topic->id]);
        $this->assertCount(1, $post->topic);

        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);

        $this->assertDatabaseMissing('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertDatabaseMissing('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $tag->id,
        ]);

        $this->assertCount(0, $post->refresh()->tags);
        $this->assertCount(0, $post->refresh()->topic);
    }
}
