<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\Carbon;
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

    it('flags list rows with unpublished edits without exposing the pending blob', function (): void {
        $pendingPost = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-title',
            'published_at' => now()->subDay(),
            'pending' => [
                'title' => 'Pending Title',
                'slug' => 'live-title',
                'summary' => null,
                'body' => 'Pending body',
                'featured_image' => null,
                'featured_image_caption' => null,
                'meta' => null,
                'tags' => [],
                'topic' => null,
            ],
        ]);
        $cleanPost = createPublishedPost(['user_id' => $this->admin->id, 'title' => 'Clean Live']);

        $rows = collect(
            $this->actingAs($this->admin, 'canvas')
                ->getJson('canvas/api/posts')
                ->assertSuccessful()
                ->json('posts.data')
        );

        $pendingRow = $rows->firstWhere('id', $pendingPost->id);
        $cleanRow = $rows->firstWhere('id', $cleanPost->id);

        expect($pendingRow)->not->toBeNull()
            ->and($pendingRow['has_pending_changes'])->toBeTrue()
            ->and(array_key_exists('pending', $pendingRow))->toBeFalse()
            ->and($cleanRow)->not->toBeNull()
            ->and($cleanRow['has_pending_changes'])->toBeFalse()
            ->and(array_key_exists('pending', $cleanRow))->toBeFalse();
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

    it('includes a display-only author on show for another authors post', function (): void {
        $canvasUser = $this->contributor->canvasUser;
        $canvasUser?->update([
            'username' => 'contrib-author',
            'avatar' => 'https://cdn.example.com/avatars/contrib.jpg',
        ]);

        $post = Post::factory()->create([
            'user_id' => $this->contributor->id,
        ]);

        $this->actingAs($this->editor, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}")
            ->assertSuccessful()
            ->assertJsonPath('post.user_id', $this->contributor->id)
            ->assertJsonPath('post.user.id', $this->contributor->id)
            ->assertJsonPath('post.user.name', $this->contributor->name)
            ->assertJsonPath('post.user.username', 'contrib-author')
            ->assertJsonPath('post.user.avatar_url', 'https://cdn.example.com/avatars/contrib.jpg')
            ->assertJsonMissingPath('post.user.email')
            ->assertJsonMissingPath('post.user.password');
    });

    it('keeps author sticky when an editor saves another authors post', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->contributor->id,
            'title' => 'Original',
            'slug' => 'original-slug',
        ]);

        $this->actingAs($this->editor, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Edited by editor',
                'slug' => 'original-slug',
                'user_id' => $this->editor->id,
            ])
            ->assertSuccessful()
            ->assertJsonPath('user_id', $this->contributor->id)
            ->assertJsonPath('user.id', $this->contributor->id)
            ->assertJsonPath('title', 'Edited by editor');

        expect($post->fresh()->user_id)->toBe($this->contributor->id);
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
                    'comparable' => true,
                ],
            ])
            ->assertJsonFragment([
                'monthOverMonthVisits' => [
                    'direction' => 'down',
                    'percentage' => '100',
                    'comparable' => true,
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
                    'comparable',
                ],
                'monthOverMonthVisits' => [
                    'direction',
                    'percentage',
                    'comparable',
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
                    'comparable',
                ],
                'monthOverMonthVisits' => [
                    'direction',
                    'percentage',
                    'comparable',
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
            ->assertStatus(422)
            ->assertJsonPath('code', 'stats_published_only');
    });
    it('scheduled posts do not display stats', function (): void {
        $post = Post::factory()->create([
            'published_at' => now()->addWeek(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/stats")
            ->assertStatus(422)
            ->assertJsonPath('code', 'stats_published_only');
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

    it('stores a new draft without a title', function (): void {
        $id = (string) Str::uuid();

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$id}", [
                'slug' => 'no-title-yet',
                'title' => '',
                'body' => '<p>Draft body only</p>',
            ])
            ->assertCreated()
            ->assertJsonPath('id', $id)
            ->assertJsonPath('slug', 'no-title-yet')
            ->assertJsonPath('title', null)
            ->assertJsonPath('user_id', $this->admin->id)
            ->assertJsonPath('body', '<p>Draft body only</p>');
    });

    it('updates an existing draft post', function (): void {
        $post = Post::factory()->draft()->create();

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

    it('allows clearing the title on an existing draft (lists show Untitled post)', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Had a title',
            'slug' => 'had-a-title',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => '',
                'slug' => $post->slug,
            ])
            ->assertOk()
            ->assertJsonPath('title', null);

        expect($post->fresh()->title)->toBeNull();
    });

    it('autosaves live published posts into pending without mutating the public snapshot', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'body' => 'Live body',
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Edited Title',
                'slug' => 'edited-slug',
                'body' => 'Edited body',
                'published_at' => $post->published_at->toIso8601String(),
            ])
            ->assertOk()
            ->assertJsonPath('title', 'Live Title')
            ->assertJsonPath('slug', 'live-slug')
            ->assertJsonPath('body', 'Live body')
            ->assertJsonPath('has_pending_changes', true)
            ->assertJsonPath('pending.title', 'Edited Title')
            ->assertJsonPath('pending.slug', 'edited-slug')
            ->assertJsonPath('pending.body', 'Edited body');

        $fresh = $post->fresh();

        expect($fresh->title)->toBe('Live Title')
            ->and($fresh->slug)->toBe('live-slug')
            ->and($fresh->body)->toBe('Live body')
            ->and($fresh->has_pending_changes)->toBeTrue()
            ->and($fresh->pending['title'] ?? null)->toBe('Edited Title');
    });

    it('promotes pending changes onto the live published snapshot', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'body' => 'Live body',
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Promoted Title',
                'slug' => 'promoted-slug',
                'body' => 'Promoted body',
                'published_at' => $post->published_at->toIso8601String(),
                'promote' => true,
            ])
            ->assertOk()
            ->assertJsonPath('title', 'Promoted Title')
            ->assertJsonPath('slug', 'promoted-slug')
            ->assertJsonPath('body', 'Promoted body')
            ->assertJsonPath('has_pending_changes', false)
            ->assertJsonPath('pending', null);

        $fresh = $post->fresh();

        expect($fresh->title)->toBe('Promoted Title')
            ->and($fresh->slug)->toBe('promoted-slug')
            ->and($fresh->body)->toBe('Promoted body')
            ->and($fresh->pending)->toBeNull();
    });

    it('clears no-op pending when the editor reloads a post', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'summary' => null,
            'body' => '<p>Live body</p>',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'published_at' => now()->subDay(),
            'pending' => [
                'title' => 'Live Title',
                'slug' => 'live-slug',
                'summary' => null,
                'body' => '<p>Live body</p>',
                'featured_image' => null,
                'featured_image_caption' => null,
                'meta' => null,
                'tags' => [],
                'topic' => null,
            ],
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('post.has_pending_changes', false)
            ->assertJsonPath('post.pending', null);

        expect($post->fresh()->pending)->toBeNull();
    });

    it('does not reintroduce pending after promote when the next autosave matches live', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'summary' => null,
            'body' => 'Live body',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'published_at' => now()->subDay(),
        ]);

        $payload = [
            'title' => 'Promoted Title',
            'slug' => 'promoted-slug',
            'summary' => null,
            'body' => 'Promoted body',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'tags' => [],
            'topic' => [],
            'published_at' => $post->published_at->toIso8601String(),
        ];

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [...$payload, 'promote' => true])
            ->assertOk()
            ->assertJsonPath('has_pending_changes', false);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", $payload)
            ->assertOk()
            ->assertJsonPath('title', 'Promoted Title')
            ->assertJsonPath('body', 'Promoted body')
            ->assertJsonPath('has_pending_changes', false)
            ->assertJsonPath('pending', null);

        expect($post->fresh()->pending)->toBeNull();
    });

    it('discards pending changes and restores the live snapshot', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'published_at' => now()->subDay(),
            'pending' => [
                'title' => 'Pending Title',
                'slug' => 'pending-slug',
                'summary' => null,
                'body' => 'Pending body',
                'featured_image' => null,
                'featured_image_caption' => null,
                'meta' => null,
                'tags' => [],
                'topic' => null,
            ],
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/discard")
            ->assertOk()
            ->assertJsonPath('title', 'Live Title')
            ->assertJsonPath('has_pending_changes', false)
            ->assertJsonPath('pending', null);

        expect($post->fresh()->pending)->toBeNull();
    });

    it('stores a future published_at with time-of-day fidelity and keeps the post non-live', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
        ]);

        $scheduledAt = now()->addDays(3)->seconds(0)->milliseconds(0);
        $payload = $scheduledAt->toIso8601String();
        $stored = $scheduledAt->timezone(config('app.timezone'))->format('Y-m-d H:i:s');

        $response = $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => $payload,
                'schedule' => true,
                'promote' => true,
            ])
            ->assertOk();

        $fresh = $post->fresh();

        expect($fresh)->not->toBeNull()
            ->and($fresh->published_at)->not->toBeNull()
            ->and($fresh->published_at->format('Y-m-d H:i:s'))->toBe($stored)
            ->and($fresh->published)->toBeFalse()
            ->and(Post::query()->published()->whereKey($post->id)->exists())->toBeFalse()
            ->and(Post::query()->draft()->whereKey($post->id)->exists())->toBeTrue();

        $responsePublishedAt = $response->json('published_at');
        expect($responsePublishedAt)->not->toBeNull();

        $returned = Carbon::parse($responsePublishedAt);
        expect($returned->format('Y-m-d H:i'))->toBe($scheduledAt->format('Y-m-d H:i'));
    });

    it('treats a past published_at datetime as live after store', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
        ]);

        $publishedAt = now()->subHours(2)->seconds(0)->milliseconds(0);
        $payload = $publishedAt->toIso8601String();
        $stored = $publishedAt->timezone(config('app.timezone'))->format('Y-m-d H:i:s');

        $response = $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => $payload,
                'promote' => true,
            ])
            ->assertOk();

        $returned = Carbon::parse($response->json('published_at'));

        expect($returned->format('Y-m-d H:i'))->toBe($publishedAt->format('Y-m-d H:i'));

        $fresh = $post->fresh();

        expect($fresh->published_at->format('Y-m-d H:i:s'))->toBe($stored)
            ->and($fresh->published)->toBeTrue()
            ->and(Post::query()->published()->whereKey($post->id)->exists())->toBeTrue()
            ->and(Post::query()->draft()->whereKey($post->id)->exists())->toBeFalse();
    });

    // Regression: browser local wall clock mis-stored as app TZ → schedule goes live immediately
    it('converts offset-aware schedule instants into app timezone storage', function (): void {
        config(['app.timezone' => 'UTC']);
        Carbon::setTestNow(Carbon::parse('2026-07-25T15:00:00Z'));

        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Chicago schedule',
            'slug' => 'chicago-schedule',
        ]);

        // America/Chicago summer = UTC-5; "now + 1 hour" local wall = 11:00 CDT = 16:00 UTC
        $payload = '2026-07-25T11:00:00-05:00';

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => $payload,
                'schedule' => true,
                'promote' => true,
            ])
            ->assertOk();

        $fresh = $post->fresh();

        expect($fresh->published_at->format('Y-m-d H:i:s'))->toBe('2026-07-25 16:00:00')
            ->and($fresh->published)->toBeFalse();

        Carbon::setTestNow();
    });

    it('rejects schedule when published_at is not in the future', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Too late',
            'slug' => 'too-late',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => now()->subHour()->toIso8601String(),
                'schedule' => true,
                'promote' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['published_at']);
    });

    it('rejects timezone-naive published_at on the wire', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Naive',
            'slug' => 'naive-datetime',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => now()->addDay()->format('Y-m-d H:i:s'),
                'promote' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['published_at']);
    });

    it('stamps server now when publish_now is set', function (): void {
        Carbon::setTestNow(Carbon::parse('2026-07-25T15:30:00Z'));

        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Publish now',
            'slug' => 'publish-now',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => null,
                'publish_now' => true,
                'promote' => true,
            ])
            ->assertOk();

        $fresh = $post->fresh();

        expect($fresh->published_at->format('Y-m-d H:i:s'))->toBe('2026-07-25 15:30:00')
            ->and($fresh->published)->toBeTrue();

        Carbon::setTestNow();
    });

    it('lets contributors update only their own posts', function (): void {
        $post = Post::factory()->draft()->create([
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
                'promote' => true,
            ])
            ->assertOk()
            ->assertJsonPath('slug', 'editor-unique-for-author')
            ->assertJsonPath('user_id', $this->contributor->id);

        expect($authorPost->fresh()->slug)->toBe('authors-existing-slug');
    });
});

describe('when syncing taxonomy', function (): void {
    it('ignores unknown tags when the post is published', function (): void {
        $post = Post::factory()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'published_at' => now()->subDay()->toIso8601String(),
            'promote' => true,
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

        $this->assertCount(0, $post->fresh()->tags);
        $this->assertDatabaseMissing('canvas_tags', ['slug' => 'a-new-tag']);
        $this->assertDatabaseMissing('canvas_tags', ['slug' => 'another-tag']);
    });

    it('does not create tags while the post is a draft', function (): void {
        $post = Post::factory()->draft()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'published_at' => null,
            'tags' => [
                [
                    'name' => 'Draft only tag',
                    'slug' => 'draft-only-tag',
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", $data)
            ->assertSuccessful();

        $this->assertCount(0, $post->fresh()->tags);
        $this->assertDatabaseMissing('canvas_tags', ['slug' => 'draft-only-tag']);
    });

    it('syncs existing tags on drafts without creating new ones', function (): void {
        $post = Post::factory()->draft()->create();
        $tag = Tag::factory()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'published_at' => null,
            'tags' => [
                [
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                ],
                [
                    'name' => 'Still pending',
                    'slug' => 'still-pending',
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", $data)
            ->assertSuccessful();

        $this->assertCount(1, $post->fresh()->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);
        $this->assertDatabaseMissing('canvas_tags', ['slug' => 'still-pending']);
    });

    it('syncs existing tags', function (): void {
        $post = Post::factory()->create();
        $tag = Tag::factory()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'promote' => true,
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

        $this->assertCount(1, $post->fresh()->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);
    });

    it('stores taxonomy on pending without touching live pivots for published posts', function (): void {
        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
        ]);
        $tag = Tag::factory()->create();

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'published_at' => $post->published_at->toIso8601String(),
                'tags' => [
                    [
                        'name' => $tag->name,
                        'slug' => $tag->slug,
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('has_pending_changes', true)
            ->assertJsonPath('pending.tags.0.slug', $tag->slug);

        expect($post->fresh()->tags)->toHaveCount(0);
    });

    it('ignores an unknown topic when the post is published', function (): void {
        $post = Post::factory()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'published_at' => now()->subDay()->toIso8601String(),
            'promote' => true,
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

        $this->assertNull($post->refresh()->topic_id);
        $this->assertDatabaseMissing('canvas_topics', ['slug' => 'a-new-topic']);
    });

    it('does not create a topic while the post is a draft', function (): void {
        $post = Post::factory()->draft()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'published_at' => null,
            'topic' => [
                [
                    'name' => 'Draft topic',
                    'slug' => 'draft-topic',
                ],
            ],
        ];

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", $data)
            ->assertSuccessful();

        $this->assertNull($post->refresh()->topic_id);
        $this->assertDatabaseMissing('canvas_topics', ['slug' => 'draft-topic']);
    });

    it('syncs an existing topic', function (): void {
        $post = Post::factory()->create();
        $topic = Topic::factory()->create();

        $data = [
            'title' => $post->title,
            'slug' => $post->slug,
            'promote' => true,
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
