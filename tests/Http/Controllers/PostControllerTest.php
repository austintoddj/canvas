<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class PostControllerTest.
 *
 * @covers \Canvas\Http\Controllers\PostController
 * @covers \Canvas\Http\Requests\StorePostRequest
 * @covers \Canvas\Canvas
 */
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testAllPublishedPostsAreFetchedByDefault(): void
    {
        $user = User::factory()
            ->has(Post::factory()->published())
            ->has(Post::factory()->draft())
            ->create();

        $this->actingAs($user, 'canvas')
             ->getJson(route('canvas.posts.index'))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $user->posts()->published()->first()->id,
                 'total' => Post::published()->count(),
                 'drafts_count' => Post::draft()->count(),
                 'published_count' => Post::published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $user->posts()->draft()->first()->id,
             ]);
    }

    public function testPublishedPostsCanBeFetchedWithAGivenQueryParameter(): void
    {
        $user = User::factory()
            ->has(Post::factory()->published())
            ->has(Post::factory()->draft())
            ->create();

        $this->actingAs($user, 'canvas')
             ->getJson(route('canvas.posts.index', ['type' => 'published']))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $user->posts()->published()->first()->id,
                 'total' => Post::published()->count(),
                 'drafts_count' => Post::draft()->count(),
                 'published_count' => Post::published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $user->posts()->draft()->first()->id,
             ]);
    }

    public function testAllPublishedPostsAreFetchedByDefaultForAdmin(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published())
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->published())
            ->create();

        $contributor = User::factory()
            ->contributor()
            ->has(Post::factory()->draft())
            ->create();

        $this->actingAs($admin, 'canvas')
             ->getJson(route('canvas.posts.index'))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $admin->posts()->first()->id,
                 'id' => $editor->posts()->first()->id,
                 'total' => Post::published()->count(),
                 'drafts_count' => Post::draft()->count(),
                 'published_count' => Post::published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $contributor->posts()->first()->id,
             ]);
    }

    public function testContributorsFetchOwnedPublishedPostsByDefault(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published())
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->published())
            ->create();

        $contributor = User::factory()
            ->contributor()
            ->has(Post::factory()->published())
            ->create();

        $this->actingAs($contributor, 'canvas')
             ->getJson(route('canvas.posts.index'))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $contributor->posts()->first()->id,
                 'total' => $contributor->posts()->count(),
                 'drafts_count' => $contributor->posts()->draft()->count(),
                 'published_count' => $contributor->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $admin->posts()->first()->id,
                 'id' => $editor->posts()->first()->id,
             ]);
    }

    public function testContributorsAreRestrictedToOwnedPosts(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published())
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->published())
            ->create();

        $contributor = User::factory()
            ->contributor()
            ->has(Post::factory()->published())
            ->create();

        $this->actingAs($contributor, 'canvas')
             ->getJson(route('canvas.posts.index', ['author' => $editor->id]))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $contributor->posts()->first()->id,
                 'total' => $contributor->posts()->count(),
                 'drafts_count' => $contributor->posts()->draft()->count(),
                 'published_count' => $contributor->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $admin->posts()->first()->id,
                 'id' => $editor->posts()->first()->id,
             ]);
    }

    public function testPublishedPostsCanBeFetchedByAuthorWithAGivenQueryParameter(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published())
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->published())
            ->create();

        $this->actingAs($admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['author' => $editor->id, 'type' => 'published']))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $editor->posts()->first()->id,
                 'total' => $editor->posts()->published()->count(),
                 'drafts_count' => $editor->posts()->draft()->count(),
                 'published_count' => $editor->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $admin->posts()->first()->id,
             ]);
    }

    public function testDraftPostsCanBeFetchedByAuthorWithAGivenQueryParameter(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->draft())
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->draft())
            ->create();

        $this->actingAs($admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['author' => $editor->id, 'type' => 'draft']))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $editor->posts()->first()->id,
                 'total' => $editor->posts()->draft()->count(),
                 'drafts_count' => $editor->posts()->draft()->count(),
                 'published_count' => $editor->posts()->published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $admin->posts()->first()->id,
             ]);
    }

    public function testAllDraftPostsCanBeFetchedWithAGivenQueryParameter(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->draft())
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->draft())
            ->create();

        $contributor = User::factory()
            ->contributor()
            ->has(Post::factory()->published())
            ->create();

        $this->actingAs($admin, 'canvas')
             ->getJson(route('canvas.posts.index', ['type' => 'draft']))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'users',
             ])
             ->assertJsonFragment([
                 'id' => $admin->posts()->first()->id,
                 'id' => $editor->posts()->first()->id,
                 'total' => Post::draft()->count(),
                 'drafts_count' => Post::draft()->count(),
                 'published_count' => Post::published()->count(),
             ])
             ->assertJsonMissing([
                 'id' => $contributor->posts()->first()->id,
             ]);
    }

    public function testPostsCanBeSortedByCreationDateWithAGivenQueryParameter(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published()->state(fn () => ['created_at' => now()->subHour()]))
            ->create();

        $editor = User::factory()
            ->editor()
            ->has(Post::factory()->published()->state(fn () => ['created_at' => now()->subDay()]))
            ->create();

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.posts.index', ['sort' => 'desc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()['posts']->first()->id, $admin->posts()->first()->id);

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.posts.index', ['sort' => 'asc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()['posts']->first()->id, $editor->posts()->first()->id);

        $response = $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.posts.index'))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()['posts']->first()->id, $admin->posts()->first()->id);
    }

    public function testExistingPostData(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published())
            ->create();

        $this->actingAs($admin, 'canvas')
             ->getJson(route('canvas.posts.show', ['post' => $admin->posts()->first()->id]))
             ->assertSuccessful()
             ->assertJsonStructure([
                 'post',
                 'tags',
                 'topics',
             ])
             ->assertJsonFragment([
                 'id' => $admin->posts()->first()->id,
             ]);
    }

    public function testPostNotFound(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'canvas')
             ->getJson(route('canvas.posts.show', ['post' => 'not-a-post']))
             ->assertNotFound();
    }

    public function testContributorAccessRestricted(): void
    {
        $post = Post::factory()->for(User::factory()->admin())->create();

        $contributor = User::factory()->contributor()->create();

        $this->actingAs($contributor, 'canvas')
             ->getJson(route('canvas.posts.show', ['post' => $post->id]))
             ->assertNotFound();
    }

    public function testStoreNewPost(): void
    {
        $user = User::factory()->contributor()->create();

        $data = [
            'slug' => 'a-new-post',
            'title' => 'A new post',
            'user_id' => $user->id,
        ];

        $this->actingAs($user, 'canvas')
             ->postJson(route('canvas.posts.store', $data))
             ->assertSuccessful()
             ->assertJsonFragment([
                 'slug' => $data['slug'],
                 'title' => $data['title'],
                 'user_id' => $user->id,
             ]);
    }

    public function testUpdateExistingPost(): void
    {
        $user = User::factory()->has(Post::factory())->create();

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $user->posts()->first()->id]), $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $user->posts()->first()->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);
    }

    public function testAContributorCanUpdateTheirOwnPost(): void
    {
        $post = Post::factory()->for(User::factory()->contributor())->create();

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($post->user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);
    }

    public function testAContributorCannotUpdateAnEditorsPost(): void
    {
        $contributor = User::factory()->contributor()->create();

        $post = Post::factory()->for(User::factory()->editor())->create();

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($contributor, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), $data)
             ->assertForbidden();
    }

    public function testSyncNewTags(): void
    {
        $post = Post::factory()->for(User::factory())->create();

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

        $this->actingAs($post->user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), $data)
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
        $post = Post::factory()->for(User::factory())->create();

        $tag = Tag::factory()->create();

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

        $this->actingAs($post->user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), $data)
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

    public function testAssociateNewTopic(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'topic' => [
                'name' => 'A new topic',
                'slug' => 'a-new-topic',
            ],
        ];

        $response = $this->actingAs($post->user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);

        $this->assertModelExists($response->getOriginalContent()->topic);
        $this->assertSame($data['topic']['slug'], $response->getOriginalContent()->topic->slug);
    }

    public function testAssociateExistingTopic(): void
    {
        $post = Post::factory()->for(User::factory())->create();
        $topic = Topic::factory()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'topic' => [
                'name' => $topic->name,
                'slug' => $topic->slug,
            ],
        ];

        $response = $this->actingAs($post->user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $post->id,
                 'title' => $data['title'],
                 'slug' => $data['slug'],
             ]);

        $this->assertModelExists($response->getOriginalContent()->topic);
        $this->assertSame($data['topic']['slug'], $response->getOriginalContent()->topic->slug);
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $this->actingAs($post->user, 'canvas')
             ->postJson(route('canvas.posts.store', ['post' => $post->id]), [
                 'slug' => 'a new.slug',
                 'title' => $post->title,
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
        $contributor = User::factory()->contributor()->create();
        $post = Post::factory()->for(User::factory()->editor())->create();

        $this->actingAs($contributor, 'canvas')
             ->deleteJson(route('canvas.posts.store', ['post' => $post->id]))
             ->assertNotFound();

        $this->actingAs($post->user, 'canvas')
             ->deleteJson(route('canvas.posts.store', ['post' => 'not-a-post']))
             ->assertNotFound();

        $this->actingAs($post->user, 'canvas')
             ->deleteJson(route('canvas.posts.store', ['post' => $post->id]))
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);
    }
}
