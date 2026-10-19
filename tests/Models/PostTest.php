<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

it('casts dates to Carbon objects', function (): void {
    $this->assertInstanceOf(Carbon::class, Post::factory()->create()->published_at);
});
it('meta is cast to array', function (): void {
    $this->assertIsArray(Post::factory()->create()->meta);
});
it('computes the published attribute', function (): void {
    $this->assertTrue(Post::factory()->create([
        'published_at' => now()->subDay(),
    ])->published);

    $this->assertFalse(Post::factory()->create([
        'published_at' => now()->addDay(),
    ])->published);

    $this->assertFalse(Post::factory()->draft()->create()->published);
});

it('serializes published_at with time fidelity', function (): void {
    $at = now()->addDays(2)->setTime(14, 30, 0);

    $post = Post::factory()->create([
        'published_at' => $at,
    ]);

    $json = $post->fresh()->toArray();

    expect($json['published_at'])->not->toBeNull();

    $parsed = Carbon::parse($json['published_at']);

    expect($parsed->format('Y-m-d H:i'))->toBe($at->format('Y-m-d H:i'))
        ->and($parsed->format('H:i'))->not->toBe('00:00');
});
it('allows a user to save a post slug', function (): void {
    $data = [
        'slug' => 'a-new-post',
        'title' => 'A new post',
    ];

    $post = Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("/canvas/api/posts/{$post->id}", $data)
        ->assertSuccessful();

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $response->original['id'],
        'slug' => $response->original['slug'],
        'user_id' => $response->original['user_id'],
    ]);
});

it('normalizes public storage featured images to root-relative on save', function (): void {
    $post = Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("/canvas/api/posts/{$post->id}", [
            'slug' => $post->slug,
            'title' => 'Featured image post',
            'featured_image' => 'http://localhost:8000/storage/canvas/images/hero.jpg',
        ])
        ->assertSuccessful();

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $post->id,
        'featured_image' => '/storage/canvas/images/hero.jpg',
    ]);
});

it('leaves external featured images absolute on save', function (): void {
    $post = Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("/canvas/api/posts/{$post->id}", [
            'slug' => $post->slug,
            'title' => 'Unsplash featured',
            'featured_image' => 'https://images.unsplash.com/photo-1',
        ])
        ->assertSuccessful();

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $post->id,
        'featured_image' => 'https://images.unsplash.com/photo-1',
    ]);
});

it('casts pending to an array and reports pending changes', function (): void {
    $post = Post::factory()->create([
        'pending' => [
            'title' => 'Pending',
            'slug' => 'pending',
        ],
    ]);

    expect($post->pending)->toBeArray()
        ->and($post->has_pending_changes)->toBeTrue();

    $post->clearPending();
    $post->save();

    expect($post->fresh()->has_pending_changes)->toBeFalse();
});

it('does not store pending when the editor payload matches the live snapshot', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => 'Live summary',
        'body' => '<p>Live body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
        'published_at' => now()->subDay(),
        'pending' => null,
    ]);

    $post->writePending([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => 'Live summary',
        'body' => '<p>Live body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
    ]);

    expect($post->fresh()->pending)->toBeNull()
        ->and($post->fresh()->has_pending_changes)->toBeFalse();
});

it('clears existing pending when a later autosave matches the live snapshot', function (): void {
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
            'title' => 'Stale pending',
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

    expect($post->has_pending_changes)->toBeTrue();

    $post->writePending([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Live body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
    ]);

    expect($post->fresh()->pending)->toBeNull()
        ->and($post->fresh()->has_pending_changes)->toBeFalse();
});

it('reconciles no-op pending blobs and leaves real diffs intact', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => 'Live summary',
        'body' => '<p>Live body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
        'published_at' => now()->subDay(),
        'pending' => [
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'summary' => 'Live summary',
            'body' => '<p>Live body</p>',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'tags' => [],
            'topic' => null,
        ],
    ]);

    $post->reconcileNoOpPending();

    expect($post->fresh()->pending)->toBeNull()
        ->and($post->fresh()->has_pending_changes)->toBeFalse();

    $post->update([
        'pending' => [
            'title' => 'Different pending',
            'slug' => 'live-slug',
            'summary' => 'Live summary',
            'body' => '<p>Live body</p>',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'tags' => [],
            'topic' => null,
        ],
    ]);

    $post->refresh()->reconcileNoOpPending();

    expect($post->fresh()->pending['title'])->toBe('Different pending');
});

it('builds pending payloads with topic and tag snapshots', function (): void {
    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => ['title' => 'SEO'],
    ]);

    $payload = $post->buildPendingPayload(
        ['title' => 'Pending Title'],
        [
            ['name' => 'Laravel', 'slug' => 'laravel'],
            ['name' => 'Missing slug'],
        ],
        [
            ['name' => 'Engineering', 'slug' => 'engineering'],
        ],
    );

    expect($payload)->toMatchArray([
        'title' => 'Pending Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'meta' => ['title' => 'SEO'],
        'tags' => [
            ['name' => 'Laravel', 'slug' => 'laravel'],
        ],
        'topic' => [
            'name' => 'Engineering',
            'slug' => 'engineering',
        ],
    ]);
});

it('does not treat pending as matching live when meta or taxonomy differs', function (): void {
    $tag = Tag::factory()->create(['slug' => 'laravel', 'name' => 'Laravel']);
    $topic = Topic::factory()->create(['slug' => 'engineering', 'name' => 'Engineering']);

    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => ['title' => 'Live SEO'],
        'topic_id' => $topic->id,
    ]);
    $post->tags()->sync([$tag->id]);

    $matching = $post->buildPendingPayload(
        [
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'summary' => null,
            'body' => '<p>Body</p>',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => ['title' => 'Live SEO'],
        ],
        [['name' => 'Laravel', 'slug' => 'laravel']],
        [['name' => 'Engineering', 'slug' => 'engineering']],
    );

    expect($post->pendingPayloadMatchesLive($matching))->toBeTrue();

    $metaDiffers = $matching;
    $metaDiffers['meta'] = ['title' => 'Different SEO'];

    expect($post->pendingPayloadMatchesLive($metaDiffers))->toBeFalse();

    $emptyMetaVsLive = $matching;
    $emptyMetaVsLive['meta'] = null;

    expect($post->pendingPayloadMatchesLive($emptyMetaVsLive))->toBeFalse();

    $topicDiffers = $matching;
    $topicDiffers['topic'] = ['name' => 'Other', 'slug' => 'other'];

    expect($post->pendingPayloadMatchesLive($topicDiffers))->toBeFalse();
});

it('normalizes empty meta strings when comparing pending to live', function (): void {
    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => ['description' => null, 'title' => 'SEO'],
    ]);

    $pending = $post->buildPendingPayload([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => ['title' => 'SEO', 'description' => ''],
    ]);

    expect($post->pendingPayloadMatchesLive($pending))->toBeTrue();
});

it('ignores missing scalar keys when comparing pending to live', function (): void {
    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => 'Summary',
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
    ]);

    expect($post->pendingPayloadMatchesLive([
        'meta' => null,
        'tags' => [],
        'topic' => null,
    ]))->toBeTrue();
});

it('compares non-array meta payloads with strict equality', function (): void {
    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => ['title' => 'SEO'],
    ]);

    expect($post->pendingPayloadMatchesLive([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => 'not-an-array',
        'tags' => [],
        'topic' => null,
    ]))->toBeFalse();
});

it('treats non-scalar pending field values as null when comparing to live', function (): void {
    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
    ]);

    expect($post->pendingPayloadMatchesLive([
        'title' => ['nested'],
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
        'tags' => [],
        'topic' => null,
    ]))->toBeFalse();
});

it('normalizes nested empty meta strings when comparing pending to live', function (): void {
    $post = Post::factory()->create([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => [
            'open_graph' => [
                'title' => null,
                'description' => 'Desc',
            ],
        ],
    ]);

    expect($post->pendingPayloadMatchesLive([
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'summary' => null,
        'body' => '<p>Body</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => [
            'open_graph' => [
                'title' => '',
                'description' => 'Desc',
            ],
        ],
        'tags' => [],
        'topic' => null,
    ]))->toBeTrue();
});

// Regression: public /{slug} URLs cannot tell authors apart, so a hand-typed slug is unique across users.
// A slug that still follows the title is suffixed instead; see the title-derived tests below.
it('rejects a slug another author already uses', function (): void {
    $data = [
        'slug' => 'a-new-post',
        'title' => 'Editor notes',
    ];

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => $data['slug'],
        'title' => $data['title'],
    ]);

    $secondaryPost = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$secondaryPost->id}", $data)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('slug');

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $secondaryPost->id,
        'slug' => $secondaryPost->slug,
        'user_id' => $this->editor->id,
    ]);
})->group('database');

// Regression: rows that already share a slug stay editable; only a new slug is rejected.
it('lets an author save a post that already shares its slug', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);

    $secondaryPost = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
        'slug' => 'shared-slug',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$secondaryPost->id}", [
            'slug' => 'shared-slug',
            'title' => 'Editor draft updated',
        ])
        ->assertSuccessful()
        ->assertJsonPath('slug', 'shared-slug')
        ->assertJsonPath('title', 'Editor draft updated');
})->group('database');

// Regression: a legacy shared slug that still matches the title must not be renumbered on autosave.
it('keeps a shared slug when the title still derives that slug', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
        'title' => 'Hello World',
    ]);

    $post = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
        'slug' => 'hello-world',
        'title' => 'Hello World',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$post->id}", [
            'slug' => 'hello-world',
            'title' => 'Hello World',
            'body' => '<p>Still shared</p>',
        ])
        ->assertSuccessful()
        ->assertJsonPath('slug', 'hello-world')
        ->assertJsonPath('body', '<p>Still shared</p>');
})->group('database');

it('leaves the create placeholder slug alone', function (): void {
    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'post-'.$id,
            'title' => 'Hello World',
            'body' => '<p>Placeholder</p>',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'post-'.$id)
        ->assertJsonPath('title', 'Hello World')
        ->assertJsonPath('body', '<p>Placeholder</p>');
})->group('database');

// Regression: a title-derived slug collision used to 422 the whole autosave, so a new post was never stored.
it('suffixes a title-derived slug and stores the rest of the post', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
        'title' => 'Hello World',
    ]);

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'hello-world',
            'title' => 'Hello World',
            'body' => '<p>Kept</p>',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'hello-world-2')
        ->assertJsonPath('title', 'Hello World')
        ->assertJsonPath('body', '<p>Kept</p>');

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $id,
        'slug' => 'hello-world-2',
        'title' => 'Hello World',
        'body' => '<p>Kept</p>',
        'user_id' => $this->editor->id,
    ]);
})->group('database');

it('uses the next free title-derived suffix when hello-world-2 is taken', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
    ]);
    Post::factory()->create([
        'user_id' => $this->contributor->id,
        'slug' => 'hello-world-2',
    ]);

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'hello-world',
            'title' => 'Hello World',
            'body' => '<p>Kept</p>',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'hello-world-3');
})->group('database');

it('keeps the suffix a post already has when the editor resubmits the title slug', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
    ]);

    $post = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
        'slug' => 'hello-world-2',
        'title' => 'Hello World',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$post->id}", [
            'slug' => 'hello-world',
            'title' => 'Hello World',
            'body' => '<p>Still here</p>',
        ])
        ->assertSuccessful()
        ->assertJsonPath('slug', 'hello-world-2')
        ->assertJsonPath('body', '<p>Still here</p>');
})->group('database');

it('rejects a hand-typed slug another author already uses and stores nothing', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'custom-slug',
    ]);

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'custom-slug',
            'title' => 'Hello World',
            'body' => '<p>Not stored</p>',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('slug');

    $this->assertDatabaseMissing('canvas_posts', [
        'id' => $id,
    ]);
})->group('database');

it('stores a colliding title-derived slug on a published post as pending', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
    ]);

    $post = Post::factory()->create([
        'user_id' => $this->editor->id,
        'title' => 'Live Title',
        'slug' => 'live-slug',
        'body' => 'Live body',
        'published_at' => now()->subDay(),
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$post->id}", [
            'slug' => 'hello-world',
            'title' => 'Hello World',
            'body' => '<p>Pending body</p>',
            'published_at' => publishedAtIso($post->published_at),
        ])
        ->assertSuccessful()
        ->assertJsonPath('slug', 'live-slug')
        ->assertJsonPath('pending.slug', 'hello-world-2')
        ->assertJsonPath('pending.title', 'Hello World')
        ->assertJsonPath('pending.body', '<p>Pending body</p>');

    expect($post->fresh()->slug)->toBe('live-slug');
})->group('database');

it('reuses a title-derived slug that only the same authors trashed post still holds', function (): void {
    $trashed = Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'hello-world',
        'title' => 'Hello World',
    ]);
    $trashed->delete();

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'hello-world',
            'title' => 'Hello World',
            'body' => '<p>Saved</p>',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'hello-world')
        ->assertJsonPath('title', 'Hello World')
        ->assertJsonPath('body', '<p>Saved</p>');

    expect(Post::onlyTrashed()->find($trashed->id)?->slug)->toBe('trashed-'.$trashed->id);
})->group('database');

it('reuses a slug that only the same authors trashed post still holds', function (): void {
    $trashed = Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'recycled-slug',
    ]);
    $trashed->delete();

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'recycled-slug',
            'title' => 'Recycled',
            'body' => '<p>Saved</p>',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'recycled-slug')
        ->assertJsonPath('body', '<p>Saved</p>');

    expect(Post::onlyTrashed()->find($trashed->id)?->slug)->toBe('trashed-'.$trashed->id);
})->group('database');

it('does not rename another authors trashed post when the slug is reused', function (): void {
    $trashed = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'recycled-slug',
    ]);
    $trashed->delete();

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("/canvas/api/posts/{$id}", [
            'slug' => 'recycled-slug',
            'title' => 'Recycled',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'recycled-slug');

    expect(Post::onlyTrashed()->find($trashed->id)?->slug)->toBe('recycled-slug');
})->group('database');

// Regression: shared public slug resolves to the earliest published post, not insertion order.
it('resolves a shared public slug to the earliest published post', function (): void {
    Post::factory()->create([
        'id' => '00000000-0000-4000-8000-000000000001',
        'user_id' => $this->admin->id,
        'slug' => 'shared-launch',
        'published_at' => now()->subHour(),
    ]);

    $earlier = Post::factory()->create([
        'id' => 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        'user_id' => $this->editor->id,
        'slug' => 'shared-launch',
        'published_at' => now()->subDays(3),
    ]);

    expect(Post::query()->forPublicSlug('shared-launch')->first()?->id)->toBe($earlier->id);
})->group('database');

it('breaks a shared public slug tie on post id', function (): void {
    $publishedAt = now()->subDay()->startOfSecond();

    Post::factory()->create([
        'id' => 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        'user_id' => $this->admin->id,
        'slug' => 'tied-launch',
        'published_at' => $publishedAt,
    ]);

    $lower = Post::factory()->create([
        'id' => '00000000-0000-4000-8000-000000000001',
        'user_id' => $this->editor->id,
        'slug' => 'tied-launch',
        'published_at' => $publishedAt,
    ]);

    expect(Post::query()->forPublicSlug('tied-launch')->first()?->id)->toBe($lower->id);
})->group('database');

it('skips drafts and scheduled posts when resolving a public slug', function (): void {
    Post::factory()->draft()->create([
        'id' => '00000000-0000-4000-8000-000000000001',
        'user_id' => $this->admin->id,
        'slug' => 'shared-launch',
    ]);

    Post::factory()->scheduled()->create([
        'user_id' => $this->admin->id,
        'slug' => 'upcoming-only',
    ]);

    $published = Post::factory()->create([
        'id' => 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        'user_id' => $this->editor->id,
        'slug' => 'shared-launch',
        'published_at' => now()->subHour(),
    ]);

    expect(Post::query()->forPublicSlug('shared-launch')->first()?->id)->toBe($published->id)
        ->and(Post::query()->forPublicSlug('upcoming-only')->first())->toBeNull();
})->group('database');
it('defines the tags relationship', function (): void {
    $post = Post::factory()->create();
    $tag = Tag::factory()->create();

    $post->tags()->sync($tag);

    $this->assertInstanceOf(BelongsToMany::class, $post->tags());
    $this->assertInstanceOf(Tag::class, $post->tags->first());
});
it('defines the topic relationship', function (): void {
    $post = Post::factory()->create();
    $topic = Topic::factory()->create();

    $post->update(['topic_id' => $topic->id]);

    $this->assertInstanceOf(BelongsTo::class, $post->topic());
    $this->assertInstanceOf(Topic::class, $post->topic);
});
it('defines the user relationship', function (): void {
    $post = Post::factory()->create();

    $this->assertInstanceOf(BelongsTo::class, $post->user());
    $this->assertInstanceOf(User::class, $post->user);
});
it('defines the views relationship', function (): void {
    $post = Post::factory()->create();

    View::factory()->create([
        'post_id' => $post->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $post->views());
    $this->assertInstanceOf(View::class, $post->views->first());
});
it('defines the visits relationship', function (): void {
    $post = Post::factory()->create();

    Visit::factory()->create([
        'post_id' => $post->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $post->visits());
    $this->assertInstanceOf(Visit::class, $post->visits->first());
});
it('applies the published scope', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $this->assertInstanceOf(Builder::class, resolve(Post::class)->published());
    $this->assertCount(1, Post::published()->get());
});
it('applies the draft scope', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->addDay(),
    ]);

    $this->assertInstanceOf(Builder::class, resolve(Post::class)->draft());
    $this->assertCount(1, Post::draft()->get());
});
it('detaches taxonomy on delete', function (): void {
    $tag = Tag::factory()->create();
    $topic = Topic::factory()->create();
    $post = Post::factory()->create(['topic_id' => $topic->id]);

    $post->tags()->sync([$tag->id]);

    $post->delete();

    $this->assertEquals(0, $post->tags->count());
    $this->assertDatabaseMissing('canvas_posts_tags', [
        'post_id' => $post->id,
        'tag_id' => $tag->id,
    ]);
});
