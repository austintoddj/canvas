<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Ramsey\Uuid\Uuid;

it('published posts are fetched by default', function (): void {
    $primaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

    $secondaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

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
it('published posts can be fetched with a given query type', function (): void {
    $primaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

    $secondaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

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
it('draft posts can be fetched with a given query type', function (): void {
    $primaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

    $secondaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

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
it('user posts are fetched by default', function (): void {
    $primaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

    $secondaryPost = Post::factory()->count(1)->create([
        'user_id' => $this->editor->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

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
it('all posts can be fetched with a given query scope', function (): void {
    Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

    Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

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
it('user posts can be fetched with a given query scope', function (): void {
    Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

    Post::factory()->count(2)->create([
        'user_id' => $this->editor->id,
        'published_at' => now()->subDay(),
    ])->each(function ($post) {
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    })->first();

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
it('new post data', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/posts/create')
        ->assertSuccessful()
        ->assertJsonStructure([
            'post',
            'tags',
            'topics',
        ]);
});
it('existing post data', function (): void {
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
it('an admin can fetch stats for any post', function (): void {
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
it('an editor can fetch any post stats', function (): void {
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
it('a contributor can fetch their own post stats', function (): void {
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
it('a contributor is unable to access stats for another user', function (): void {
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
it('post not found', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/posts/not-a-post')
        ->assertNotFound();
});
it('contributor access restricted', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    $this->actingAs($this->contributor, 'canvas')
        ->getJson("canvas/api/posts/{$post->id}")
        ->assertNotFound();
});
it('store new post', function (): void {
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
});
it('update existing post', function (): void {
    $post = Post::factory()->create();

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
});
it('a contributor can only update their own post', function (): void {
    $post = Post::factory()->create([
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
});
it('sync new tags', function (): void {
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
it('sync existing tags', function (): void {
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
it('sync new topic', function (): void {
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

    $this->assertCount(1, $post->topic);
    $this->assertDatabaseHas('canvas_posts_topics', [
        'post_id' => $post->id,
    ]);
});
it('sync existing topic', function (): void {
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

    $this->assertCount(1, $post->topic);
    $this->assertDatabaseHas('canvas_posts_topics', [
        'post_id' => $post->id,
        'topic_id' => $topic->id,
    ]);
});
it('invalid slugs are validated', function (): void {
    $post = Post::factory()->create();

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
});
it('delete existing post', function (): void {
    $post = Post::factory()->create([
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
});
it('de sync related taxonomy', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'a-new-post',
    ]);

    $tag = Tag::factory()->create();
    $post->tags()->sync([$tag->id]);

    $this->assertDatabaseHas('canvas_posts_tags', [
        'post_id' => $post->id,
        'tag_id' => $tag->id,
    ]);

    $this->assertCount(1, $post->tags);

    $topic = Topic::factory()->create();
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
});
