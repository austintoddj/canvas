<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Illuminate\Support\Str;

describe('when listing posts', function (): void {
    it('fetches published posts by default', function (): void {
        ['published' => $primaryPost, 'draft' => $secondaryPost] = createPublishedAndDraftPosts($this->admin->id);

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts')
            ->assertSuccessful()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ])
            ->assertJsonFragment([
                'id' => $primaryPost->id,
                'total' => $this->admin->posts()->published()->count(),
                'draftCount' => $this->admin->posts()->draft()->count(),
                'publishedCount' => $this->admin->posts()->published()->count(),
            ])
            ->assertJsonMissing([
                'id' => $secondaryPost->id,
            ]);
    });
    it('fetches published posts with a given query type', function (): void {
        ['published' => $primaryPost, 'draft' => $secondaryPost] = createPublishedAndDraftPosts($this->admin->id);

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts?type=published')
            ->assertSuccessful()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ])
            ->assertJsonFragment([
                'id' => $primaryPost->id,
                'total' => $this->admin->posts()->published()->count(),
                'draftCount' => $this->admin->posts()->draft()->count(),
                'publishedCount' => $this->admin->posts()->published()->count(),
            ])
            ->assertJsonMissing([
                'id' => $secondaryPost->id,
            ]);
    });
    it('fetches draft posts with a given query type', function (): void {
        ['published' => $primaryPost, 'draft' => $secondaryPost] = createPublishedAndDraftPosts($this->admin->id);

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts?type=draft')
            ->assertSuccessful()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ])
            ->assertJsonFragment([
                'id' => $secondaryPost->id,
                'total' => $this->admin->posts()->published()->count(),
                'draftCount' => $this->admin->posts()->draft()->count(),
                'publishedCount' => $this->admin->posts()->published()->count(),
            ])
            ->assertJsonMissing([
                'id' => $primaryPost->id,
            ]);
    });
    it('fetches user posts by default', function (): void {
        $primaryPost = createPublishedPost(['user_id' => $this->admin->id]);
        $secondaryPost = createPublishedPost(['user_id' => $this->editor->id]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts')
            ->assertSuccessful()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ])
            ->assertJsonFragment([
                'id' => $primaryPost->id,
                'total' => $this->admin->posts()->published()->count(),
                'draftCount' => $this->admin->posts()->draft()->count(),
                'publishedCount' => $this->admin->posts()->published()->count(),
            ])
            ->assertJsonMissing([
                'id' => $secondaryPost->id,
            ]);
    });
    it('fetches all posts with a given query scope', function (): void {
        createPublishedPosts($this->admin->id, 4);

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts?scope=all')
            ->assertSuccessful()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ])
            ->assertJsonFragment([
                'total' => $this->admin->posts()->count(),
                'draftCount' => $this->admin->posts()->draft()->count(),
                'publishedCount' => $this->admin->posts()->published()->count(),
            ]);
    });
    it('fetches user posts with a given query scope', function (): void {
        createPublishedPosts($this->admin->id);
        createPublishedPosts($this->editor->id);

        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts?scope=user')
            ->assertSuccessful()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ])
            ->assertJsonFragment([
                'total' => $this->admin->posts()->count(),
                'draftCount' => $this->admin->posts()->draft()->count(),
                'publishedCount' => $this->admin->posts()->published()->count(),
            ]);
    });
});

describe('when showing posts', function (): void {
    it('returns data for creating a post', function (): void {
        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts/create')
            ->assertSuccessful()
            ->assertJsonStructure([
                'post',
                'tags',
                'topics',
            ]);
    });
    it('returns existing post data', function (): void {
        $post = Post::factory()->create();

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}")
            ->assertSuccessful()
            ->assertJsonStructure([
                'post',
                'tags',
                'topics',
            ])
            ->assertJsonFragment([
                'id' => $post->id,
            ]);
    });
});

describe('when fetching post stats', function (): void {
    it('lets an admin fetch stats for any post', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->contributor->id,
            'published_at' => now()->subWeek(),
            'body' => null,
        ]);

        View::factory()->create([
            'post_id' => $post->id,
            'created_at' => now()->subMonthNoOverflow(),
        ]);

        Visit::factory()->create([
            'post_id' => $post->id,
            'created_at' => now()->subMonthNoOverflow(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertSuccessful()
            ->assertJsonStructure([
                'post',
                'readTime',
                'popularReadingTimes',
                'topReferers',
                'monthlyViews',
                'totalViews',
                'monthlyVisits',
                'graph' => [
                    'views',
                    'visits',
                ],
            ])
            ->assertJsonFragment([
                'monthOverMonthViews' => [
                    'direction' => 'down',
                    'percentage' => '100',
                ],
            ])
            ->assertJsonFragment([
                'monthOverMonthVisits' => [
                    'direction' => 'down',
                    'percentage' => '100',
                ],
            ]);
    });
    it('lets an editor fetch stats for any post', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->contributor->id,
        ]);

        $this->actingAs($this->editor, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertSuccessful()
            ->assertJsonStructure([
                'post',
                'readTime',
                'popularReadingTimes',
                'topReferers',
                'monthlyViews',
                'totalViews',
                'monthlyVisits',
                'monthOverMonthViews' => [
                    'direction',
                    'percentage',
                ],
                'monthOverMonthVisits' => [
                    'direction',
                    'percentage',
                ],
                'graph' => [
                    'views',
                    'visits',
                ],
            ]);
    });
    it('lets a contributor fetch stats for their own posts', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->contributor->id,
        ]);

        $this->actingAs($this->contributor, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertSuccessful()
            ->assertJsonStructure([
                'post',
                'readTime',
                'popularReadingTimes',
                'topReferers',
                'monthlyViews',
                'totalViews',
                'monthlyVisits',
                'monthOverMonthViews' => [
                    'direction',
                    'percentage',
                ],
                'monthOverMonthVisits' => [
                    'direction',
                    'percentage',
                ],
                'graph' => [
                    'views',
                    'visits',
                ],
            ]);
    });
    it('blocks contributors from accessing post stats for other users', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->contributor, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertNotFound();
    });
    it('draft posts do not display stats', function (): void {
        $post = Post::factory()->create([
            'published_at' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertNotFound();
    });
    it('scheduled posts do not display stats', function (): void {
        $post = Post::factory()->create([
            'published_at' => now()->addWeek(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertNotFound();
    });
    it('returns not found for unknown posts', function (): void {
        $this->actingAs($this->admin, 'canvas')
            ->getJson('canvas/api/posts/not-a-post')
            ->assertNotFound();
    });
    it('restricts contributor access', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->contributor, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}")
            ->assertNotFound();
    });
});

describe('when storing and updating posts', function (): void {
    it('stores a new post', function (): void {
        $data = [
            'id' => (string) Str::uuid(),
            'slug' => 'a-new-post',
            'title' => 'A new post',
        ];

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$data['id']}", $data)
            ->assertCreated()
            ->assertJsonFragment([
                'id' => $data['id'],
                'slug' => $data['slug'],
                'title' => $data['title'],
                'user_id' => $this->admin->id,
            ]);
    });
    it('updates an existing post', function (): void {
        $post = Post::factory()->create();

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", $data)
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'title' => $data['title'],
                'slug' => $data['slug'],
            ]);
    });
    it('lets contributors update only their own posts', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->contributor->id,
        ]);

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", $data)
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'title' => $data['title'],
                'slug' => $data['slug'],
            ]);
    });

    // Regression: store path must deny updates the contributor cannot perform
    it('blocks contributors from updating other users posts via store', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'slug' => 'owned-by-admin',
        ]);

        $this->actingAs($this->contributor, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Hijacked',
                'slug' => 'hijacked',
            ])
            ->assertNotFound();
    });

    // Invariant: slug uniqueness is scoped to the post owner, not the editing editor
    it('scopes slug uniqueness to the post owner when an editor updates another authors post', function (): void {
        $authorPost = Post::factory()->create([
            'user_id' => $this->contributor->id,
            'slug' => 'authors-existing-slug',
        ]);

        $otherAuthorPost = Post::factory()->create([
            'user_id' => $this->contributor->id,
            'slug' => 'other-slug',
        ]);

        $this->actingAs($this->editor, 'canvas')
            ->postJson("canvas/api/posts/{$otherAuthorPost->id}", [
                'title' => $otherAuthorPost->title,
                'slug' => 'authors-existing-slug',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);

        $this->actingAs($this->editor, 'canvas')
            ->postJson("canvas/api/posts/{$otherAuthorPost->id}", [
                'title' => 'Edited by editor',
                'slug' => 'editor-unique-for-author',
            ])
            ->assertOk()
            ->assertJsonPath('slug', 'editor-unique-for-author')
            ->assertJsonPath('user_id', $this->contributor->id);

        expect($authorPost->fresh()->slug)->toBe('authors-existing-slug');
    });
});

describe('when syncing taxonomy', function (): void {
    it('syncs new tags', function (): void {
        $post = Post::factory()->create();

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
    });
    it('syncs existing tags', function (): void {
        $post = Post::factory()->create();
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
    });
    it('syncs a new topic', function (): void {
        $post = Post::factory()->create();

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

        $this->assertInstanceOf(Topic::class, $post->refresh()->topic);
        $this->assertDatabaseHas('canvas_posts', [
            'id' => $post->id,
        ]);
    });
    it('syncs an existing topic', function (): void {
        $post = Post::factory()->create();
        $topic = Topic::factory()->create();

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

        $this->assertInstanceOf(Topic::class, $post->refresh()->topic);
        $this->assertDatabaseHas('canvas_posts', [
            'id' => $post->id,
            'topic_id' => $topic->id,
        ]);
    });
});

describe('when validating posts', function (): void {
    it('invalid slugs are validated', function (): void {
        $post = Post::factory()->create();

        $this->actingAsAdmin()
            ->postJson("canvas/api/posts/{$post->id}", [
                'slug' => 'a new.slug',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);
    });
});

describe('when deleting posts', function (): void {
    // Regression: GH-779 — contributors must not delete other users' posts
    it('contributors cannot delete other users posts', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->editor->id,
        ]);

        $this->actingAs($this->contributor, 'canvas')
            ->deleteJson("canvas/api/posts/{$post->id}")
            ->assertNotFound();
    });

    it('returns not found when deleting unknown posts', function (): void {
        $this->actingAs($this->admin, 'canvas')
            ->deleteJson('canvas/api/posts/not-a-post')
            ->assertNotFound();
    });

    it('deletes an existing post', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->editor->id,
            'slug' => 'a-new-post',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->deleteJson("canvas/api/posts/{$post->id}")
            ->assertSuccessful()
            ->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);
    });
});

describe('when removing taxonomy', function (): void {
    it('desyncs related taxonomy', function (): void {
        $topic = Topic::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'slug' => 'a-new-post',
            'topic_id' => $topic->id,
        ]);

        $tag = Tag::factory()->create();
        $post->tags()->sync([$tag->id]);

        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertCount(1, $post->tags);
        $this->assertInstanceOf(Topic::class, $post->topic);

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

        $this->assertCount(0, $post->refresh()->tags);
    });
});
