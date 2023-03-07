<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class PostControllerTest.
 *
 * @covers \Canvas\Http\Controllers\PostController
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

    public function testNewPostData(): void
    {
        $response = $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.posts.create'))
            ->assertSuccessful()
            ->assertJsonStructure([
                'post',
                'tags',
                'topics',
            ]);

        $this->assertInstanceOf(Post::class, $response->getOriginalContent()['post']);
        $this->assertIsArray($response->getOriginalContent()['tags']);
        $this->assertIsArray($response->getOriginalContent()['topics']);
    }

    public function testExistingPostData(): void
    {
        $admin = User::factory()
            ->admin()
            ->has(Post::factory()->published())
            ->create();

        $this->actingAs($admin, 'canvas')
            ->getJson(route('canvas.posts.show', ['id' => $admin->posts()->first()->id]))
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
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.posts.show', ['id' => Uuid::uuid4()->toString()]))
            ->assertNotFound();
    }

    public function testContributorAccessRestricted(): void
    {
        $adminPost = Post::factory()->for(User::factory()->admin()->create())->create();

        $this->actingAs(User::factory()->contributor()->create(), 'canvas')
            ->getJson(route('canvas.posts.show', ['id' => $adminPost->id]))
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
            ->putJson(route('canvas.posts.store', ['id' => Uuid::uuid4()->toString()]), $data)
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
            'slug' => 'updated-slug',
            'title' => 'Updated Title',
            'user_id' => $user->id,
        ];

        $this->actingAs($user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $user->posts()->first()->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'title' => $data['title'],
                'slug' => $data['slug'],
            ]);
    }

    public function testAContributorCanUpdateTheirOwnPost(): void
    {
        $post = Post::factory()->for(User::factory()->contributor())->create();

        $data = [
            'slug' => $post->slug,
            'title' => $post->title,
            'user_id' => $post->user_id,
        ];

        $this->actingAs($post->user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $post->id,
                'title' => $data['title'],
                'slug' => $data['slug'],
            ]);
    }

    public function testAContributorCannotUpdateAnEditorsPost(): void
    {
        $editorPost = Post::factory()->for(User::factory()->editor())->create();

        $this->actingAs(User::factory()->contributor()->create(), 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $editorPost->id]), [
                'slug' => $editorPost->slug,
                'title' => $editorPost->title,
                'user_id' => $editorPost->user_id,
            ])
            ->assertForbidden();
    }

    public function testSyncNewTags(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $data = [
            'slug' => $post->slug,
            'title' => $post->title,
            'user_id' => $post->user_id,
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
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), $data)
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
            'slug' => $post->slug,
            'title' => $post->title,
            'user_id' => $post->user_id,
            'tags' => [
                [
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                ],
            ],
        ];

        $this->actingAs($post->user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), $data)
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

    public function testDeleteExistingPost(): void
    {
        $contributor = User::factory()->contributor()->create();
        $editorPost = Post::factory()->for(User::factory()->editor())->create();

        $this->actingAs($contributor, 'canvas')
            ->deleteJson(route('canvas.posts.destroy', ['id' => $editorPost->id]))
            ->assertNotFound();

        $this->actingAs($editorPost->user, 'canvas')
            ->deleteJson(route('canvas.posts.destroy', ['id' => $editorPost->id]))
            ->assertSuccessful()
            ->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $editorPost->id,
            'slug' => $editorPost->slug,
        ]);
    }

    public function testShowPostMethodValidatesUuidParameter(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.posts.show', ['id' => 'not-a-post']))
            ->assertBadRequest();
    }

    public function testStorePostMethodValidatesUuidParameter(): void
    {
        $this->actingAs($user = User::factory()->admin()->create(), 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => 'not-a-post']), [
                'slug' => 'a-new-post',
                'title' => 'A new post',
                'user_id' => $user->id,
            ])
            ->assertBadRequest();
    }

    public function testGetStatsForPostMethodValidatesUuidParameter(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.posts.stats', ['id' => 'not-a-post']))
            ->assertBadRequest();
    }

    public function testDestroyPostMethodValidatesUuidParameter(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
            ->getJson(route('canvas.posts.destroy', ['id' => 'not-a-post']))
            ->assertBadRequest();
    }
}
