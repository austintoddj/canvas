<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class PostControllerTest.
 *
 * @covers \Canvas\Http\Controllers\PostController
 * @covers \Canvas\Http\Requests\PostRequest
 */
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testPublishedPostsAreFetchedByDefault(): void
    {
        $primaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $secondaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => null,
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'posts',
                 'draftCount',
                 'publishedCount',
             ])
             ->assertFragment([
                 'id' => $primaryPost->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'draftCount' => $this->admin->posts()->draft()->count(),
                 'publishedCount' => $this->admin->posts()->published()->count(),
             ])
             ->assertMissing([
                 'id' => $secondaryPost->id,
             ]);
    }

    public function testPublishedPostsCanBeFetchedWithAGivenQueryType(): void
    {
        $primaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $secondaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => null,
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts?type=published')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'posts',
                 'draftCount',
                 'publishedCount',
             ])
             ->assertFragment([
                 'id' => $primaryPost->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'draftCount' => $this->admin->posts()->draft()->count(),
                 'publishedCount' => $this->admin->posts()->published()->count(),
             ])
             ->assertMissing([
                 'id' => $secondaryPost->id,
             ]);
    }

    public function testDraftPostsCanBeFetchedWithAGivenQueryType(): void
    {
        $primaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $secondaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => null,
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts?type=draft')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'posts',
                 'draftCount',
                 'publishedCount',
             ])
             ->assertFragment([
                 'id' => $secondaryPost->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'draftCount' => $this->admin->posts()->draft()->count(),
                 'publishedCount' => $this->admin->posts()->published()->count(),
             ])
             ->assertMissing([
                 'id' => $primaryPost->id,
             ]);
    }

    public function testUserPostsAreFetchedByDefault(): void
    {
        $primaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $secondaryPost = factory(Post::class, 1)->create([
            'user_id' => $this->editor->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'posts',
                 'draftCount',
                 'publishedCount',
             ])
             ->assertFragment([
                 'id' => $primaryPost->id,
                 'total' => $this->admin->posts()->published()->count(),
                 'draftCount' => $this->admin->posts()->draft()->count(),
                 'publishedCount' => $this->admin->posts()->published()->count(),
             ])
             ->assertMissing([
                 'id' => $secondaryPost->id,
             ]);
    }

    public function testAllPostsCanBeFetchedWithAGivenQueryScope(): void
    {
        factory(Post::class, 2)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        factory(Post::class, 2)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts?scope=all')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'posts',
                 'draftCount',
                 'publishedCount',
             ])
             ->assertFragment([
                 'total' => $this->admin->posts()->count(),
                 'draftCount' => $this->admin->posts()->draft()->count(),
                 'publishedCount' => $this->admin->posts()->published()->count(),
             ]);
    }

    /** @test */
    public function testUserPostsCanBeFetchedWithAGivenQueryScope(): void
    {
        factory(Post::class, 2)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        factory(Post::class, 2)->create([
            'user_id' => $this->editor->id,
            'published_at' => now()->subDay(),
        ])->each(function ($post) {
            $post->views()->createMany(factory(View::class, 3)->make()->toArray());
        })->first();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts?scope=user')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'posts',
                 'draftCount',
                 'publishedCount',
             ])
             ->assertFragment([
                 'total' => $this->admin->posts()->count(),
                 'draftCount' => $this->admin->posts()->draft()->count(),
                 'publishedCount' => $this->admin->posts()->published()->count(),
             ]);
    }

    public function testNewPostData(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts/create')
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'post',
                 'tags',
                 'topics',
             ]);
    }

    public function testExistingPostData(): void
    {
        $post = factory(Post::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertStructure([
                 'post',
                 'tags',
                 'topics',
             ])
             ->assertFragment([
                 'id' => $post->id,
             ]);
    }

    public function testPostNotFound(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts/not-a-post')
             ->assertNotFound();
    }

    public function testContributorAccessRestricted(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->contributor, 'canvas')
             ->getJson("canvas/api/posts/{$post->id}")
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
             ->decodeResponseJson()
             ->assertFragment([
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

        $this->actingAs($post->user, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", $data)
             ->assertSuccessful()
             ->decodeResponseJson()
             ->assertFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);
    }

    public function testSyncNewTags(): void
    {
        $this->markTestSkipped();
    }

    public function testSyncNewTopic(): void
    {
        $this->markTestSkipped();
    }

    public function testSyncExistingTags(): void
    {
        $this->markTestSkipped();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
            'title' => 'A new post',
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
            'topic' => [
                [
                    'name' => 'A new topic',
                    'slug' => 'a-new-topic',
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['id'], 'id')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($this->admin->id, 'user_id');

        $post = Post::find($data['id']);

        $this->assertCount(2, $post->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
        ]);

        $this->assertCount(1, $post->topic);
        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
        ]);
    }

    public function testSyncExistingTopic(): void
    {
        $this->markTestSkipped();
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $post = factory(Post::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$post->id}", [
                 'slug' => 'a new.slug',
             ])
            ->assertStatus(422)
            ->decodeResponseJson()
            ->assertStructure([
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
