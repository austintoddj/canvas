<?php

declare(strict_types=1);

use Canvas\Enums\RevisionReason;
use Canvas\Events\PostPublished;
use Canvas\Events\PostUpdated;
use Canvas\Models\Post;
use Canvas\Models\PostTranslation;
use Canvas\Support\RecordPostRevision;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

beforeEach(function (): void {
    config(['canvas.content' => ['enabled' => true, 'locales' => ['en', 'ru', 'de'], 'default_locale' => 'en', 'fallback' => true]]);
});

it('isolates publication, pending and serialized public content by language', function (): void {
    // Invariant: public fallback never exposes another language's draft or pending edits.
    $post = Post::factory()->create(['title' => 'English', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'body' => '<p>Черновик</p>', 'published_at' => null])->save();
    $public = Post::forPublicSlug($post->slug, 'ru')->firstOrFail();
    expect($public->title)->toBe('English')->and($public->contentLocale())->toBe('en');
    expect($public->toArray())->not->toHaveKeys(['translations', 'pending', 'revisions']);
    $post->inLocale('ru')->fill(['published_at' => now()->subHour()])->save();
    $post->writePending(['title' => 'Не опубликовано']);
    $public = Post::published('ru')->firstOrFail();
    expect($public->title)->toBe('Русский')->and($public->body)->toBe('<p>Черновик</p>');
    expect(DB::table('canvas_posts')->where('id', $post->id)->value('title'))->toBe('English');
    config(['canvas.content.fallback' => false]);
    expect(Post::published('de')->count())->toBe(0);
});

it('saves and publishes translations independently through the admin API', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id, 'title' => 'English', 'published_at' => null]);
    $this->actingAsContributor()->postJson('/canvas/api/posts/'.$post->id.'?locale=ru', [
        'slug' => $post->slug, 'title' => 'Русский', 'promote' => true, 'publish_now' => true,
    ])->assertOk()->assertJsonPath('title', 'Русский')->assertJsonPath('locale', 'ru');
    expect($post->fresh()->inLocale('en')->published_at)->toBeNull();
    expect($post->fresh()->inLocale('ru')->published)->toBeTrue();
    $this->getJson('/canvas/api/posts/'.$post->id.'?locale=de')->assertOk()->assertJsonPath('post.title', null);
    $this->getJson('/canvas/api/posts/'.$post->id.'?locale=xx')->assertUnprocessable();
    $this->postJson('/canvas/api/posts/'.$post->id.'?locale=ru', ['slug' => 'changed', 'title' => 'Русский'])->assertUnprocessable()->assertJsonValidationErrors('slug');
});

it('keeps histories separate and rejects cross-language restoration', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id, 'title' => 'English']);
    $en = RecordPostRevision::fromPost($post->inLocale('en'), reason: RevisionReason::Origin);
    $post->inLocale('ru')->fill(['title' => 'Русский'])->save();
    $ru = RecordPostRevision::fromPost($post, reason: RevisionReason::Origin);
    expect($en->locale)->toBe('en')->and($ru->locale)->toBe('ru')->and($post->revisions()->count())->toBe(1);
    $this->actingAsContributor()->postJson('/canvas/api/posts/'.$post->id.'/revisions/'.$en->id.'/restore?locale=ru')->assertNotFound();
});

it('migrates old data idempotently and returns to the primary language when disabled', function (): void {
    config(['canvas.content.enabled' => false]);
    $post = Post::factory()->create(['title' => 'Legacy']);
    $revision = RecordPostRevision::fromPost($post, reason: RevisionReason::Origin);
    $this->artisan('canvas:translate-posts', ['--locale' => 'en', '--dry-run' => true])->assertSuccessful();
    expect(PostTranslation::count())->toBe(0);
    $this->artisan('canvas:translate-posts', ['--locale' => 'en'])->assertSuccessful();
    $this->artisan('canvas:translate-posts', ['--locale' => 'en'])->assertSuccessful();
    expect(PostTranslation::count())->toBe(1)->and($revision->fresh()->locale)->toBe('en');
    config(['canvas.content.enabled' => true]);
    $post = $post->fresh()->inLocale('en');
    $post->title = 'Updated';
    $post->save();
    $post->inLocale('ru')->fill(['title' => 'Русский'])->save();
    config(['canvas.content.enabled' => false]);
    expect($post->fresh()->title)->toBe('Updated');
});

it('announces a scheduled translation only once', function (): void {
    Event::fake([PostPublished::class]);
    $post = Post::factory()->create(['published_at' => null]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'published_at' => now()->subMinute()])->save();
    $this->artisan('canvas:announce-scheduled')->assertSuccessful();
    $this->artisan('canvas:announce-scheduled')->assertSuccessful();
    Event::assertDispatchedTimes(PostPublished::class, 1);
    Event::assertDispatched(PostPublished::class, fn ($event) => $event->locale === 'ru');
});

it('uses whole-version fallback and preserves intentionally empty translated fields', function (): void {
    config(['translatable.locales' => ['xx'], 'translatable.locale_key' => 'language', 'translatable.translation_suffix' => 'Other', 'translatable.use_property_fallback' => true]);
    $post = Post::factory()->create(['title' => 'English', 'summary' => 'English summary', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'summary' => null, 'published_at' => now()->subHour()])->save();
    expect(Post::published('ru')->firstOrFail()->summary)->toBeNull();
    $post->inLocale('en')->fill(['published_at' => null])->save();
    expect(Post::published('de')->count())->toBe(0)->and(Post::published('ru')->count())->toBe(1);
});

it('filters and counts translated admin lists without fallback or body leakage', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id, 'title' => 'English', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'body' => 'secret body', 'published_at' => null])->save();
    $this->actingAsContributor()->getJson('/canvas/api/posts?locale=ru&type=draft&search='.rawurlencode('Русский'))->assertOk()
        ->assertJsonPath('draftCount', 1)->assertJsonPath('publishedCount', 0)->assertJsonPath('posts.data.0.title', 'Русский')
        ->assertJsonMissingPath('posts.data.0.body')->assertJsonMissingPath('posts.data.0.translations');
    $this->getJson('/canvas/api/posts?locale=de&type=draft')->assertOk()->assertJsonPath('posts.total', 0);
});

it('keeps revision retention independent for every language', function (): void {
    $post = Post::factory()->create(['title' => 'English']);
    $en = RecordPostRevision::fromPost($post, reason: RevisionReason::Published);
    $post->inLocale('ru')->fill(['title' => 'Русский'])->save();
    RecordPostRevision::fromPost($post, reason: RevisionReason::Published);
    RecordPostRevision::fromPost($post, reason: RevisionReason::Published);
    RecordPostRevision::pruneExcessForPost($post, 1);
    expect($post->revisions()->count())->toBe(1)->and($en->fresh())->not->toBeNull();
    $this->artisan('canvas:prune-post-revisions', ['--keep' => 1])->assertSuccessful();
    expect($post->revisions()->count())->toBe(1)->and($en->fresh())->not->toBeNull();
});

it('notifies other live translations when shared fields are applied', function (): void {
    Event::fake([PostUpdated::class]);
    $post = Post::factory()->create(['user_id' => $this->contributor->id, 'title' => 'English', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'published_at' => now()->subDay()])->save();
    $this->actingAsContributor()->postJson('/canvas/api/posts/'.$post->id.'?locale=en', [
        'slug' => $post->slug, 'title' => 'English', 'featured_image_caption' => 'Shared caption', 'promote' => true,
    ])->assertOk();
    Event::assertDispatched(PostUpdated::class, fn ($event) => $event->locale === 'ru');
});

it('does not let secondary pending snapshots overwrite changed shared fields', function (): void {
    $post = Post::factory()->create(['title' => 'English', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'published_at' => now()->subDay()])->save();
    $post->writePending(['title' => 'Изменено']);
    expect($post->pending)->not->toHaveKeys(['slug', 'featured_image', 'tags', 'topic']);
});

it('synchronizes edits made while disabled and preserves secondary translations', function (): void {
    $post = Post::factory()->create(['title' => 'English']);
    $post->inLocale('ru')->fill(['title' => 'Русский'])->save();
    config(['canvas.content.enabled' => false]);
    $post = $post->fresh();
    $post->title = 'New primary';
    $post->save();
    $this->artisan('canvas:translate-posts', ['--locale' => 'en'])->assertSuccessful();
    config(['canvas.content.enabled' => true]);
    expect($post->fresh()->inLocale('en')->title)->toBe('New primary')
        ->and($post->fresh()->inLocale('ru')->title)->toBe('Русский');
});

it('counts a post with only a secondary publication once in dashboard statistics', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id, 'published_at' => null]);
    $post->inLocale('ru')->fill(['title' => 'Русский', 'published_at' => now()->subDay()])->save();
    $this->actingAsContributor()->getJson('/canvas/api/stats')->assertOk()->assertJsonPath('library.published', 1)->assertJsonPath('library.drafts', 0);
    expect(Post::publishedAny()->count())->toBe(1);
});

it('keeps public fallback safe even when callers eager load all translations', function (): void {
    $post = Post::factory()->create(['title' => 'English', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Private draft', 'published_at' => null])->save();
    $public = Post::published('ru')->with(['translations', 'revisions'])->firstOrFail();
    expect($public->title)->toBe('English')->and($public->contentLocale())->toBe('en');
    expect(json_encode($public->toArray()))->not->toContain('Private draft');
});

it('eager loads public content in a bounded number of queries without duplicate posts', function (): void {
    $posts = Post::factory()->count(3)->create(['published_at' => now()->subDay()]);
    foreach ($posts as $post) {
        $post->inLocale('ru')->fill(['title' => 'Русский', 'published_at' => now()->subDay()])->save();
    }
    DB::enableQueryLog();
    $page = Post::published('ru')->paginate();
    $page->toArray();
    $count = count(DB::getQueryLog());
    DB::disableQueryLog();
    expect($page->total())->toBe(3)->and($count)->toBeLessThanOrEqual(4);
});
