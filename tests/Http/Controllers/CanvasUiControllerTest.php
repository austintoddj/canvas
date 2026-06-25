<?php

use App\Http\Controllers\Canvas\CanvasUiController;
use Canvas\Events\PostViewed;
use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    // Publish and load the controller once per process; subsequent beforeEach calls are no-ops.
    if (! class_exists('App\Http\Controllers\Canvas\CanvasUiController')) {
        $this->artisan('canvas:ui');
        require_once app_path('Http/Controllers/Canvas/CanvasUiController.php');
    }

    Route::prefix('canvas-ui')->middleware(['web'])->group(function (): void {
        Route::get('/', [CanvasUiController::class, 'index'])
            ->name('canvas-ui.index');

        Route::get('/tags/{slug}', [CanvasUiController::class, 'tag'])
            ->name('canvas-ui.tag');

        Route::get('/topics/{slug}', [CanvasUiController::class, 'topic'])
            ->name('canvas-ui.topic');

        Route::get('/{slug}', [CanvasUiController::class, 'show'])
            ->middleware(Session::class)
            ->name('canvas-ui.show');
    });
});

it('shows a paginated listing of published posts only', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ]);

    $response = $this->get('canvas-ui')
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.index')
        ->assertViewHas('posts');

    $this->assertSame(3, $response->viewData('posts')->total());
});

it('shows a single published post', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $this->get("canvas-ui/{$post->slug}")
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.show')
        ->assertViewHas('post', fn ($p) => $p->id === $post->id);
});

it('returns 404 for a draft post', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ]);

    $this->get("canvas-ui/{$post->slug}")->assertNotFound();
});

it('returns 404 for a non-existent post slug', function (): void {
    $this->get('canvas-ui/does-not-exist')->assertNotFound();
});

it('fires the PostViewed event when a published post is viewed', function (): void {
    Event::fake(PostViewed::class);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $this->get("canvas-ui/{$post->slug}")->assertSuccessful();

    Event::assertDispatched(PostViewed::class, fn ($e) => $e->post->id === $post->id);
});

it('shows a tag page with published posts only', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->admin->id]);

    $published = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $draft = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ]);

    $tag->posts()->attach([$published->id, $draft->id]);

    $response = $this->get("canvas-ui/tags/{$tag->slug}")
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.tag')
        ->assertViewHas('tag')
        ->assertViewHas('posts');

    $this->assertSame(1, $response->viewData('posts')->total());
});

it('returns 404 for a non-existent tag', function (): void {
    $this->get('canvas-ui/tags/no-such-tag')->assertNotFound();
});

it('shows a topic page with published posts only', function (): void {
    $topic = Topic::factory()->create(['user_id' => $this->admin->id]);

    Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
        'topic_id' => $topic->id,
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
        'topic_id' => $topic->id,
    ]);

    $response = $this->get("canvas-ui/topics/{$topic->slug}")
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.topic')
        ->assertViewHas('topic')
        ->assertViewHas('posts');

    $this->assertSame(2, $response->viewData('posts')->total());
});

it('returns 404 for a non-existent topic', function (): void {
    $this->get('canvas-ui/topics/no-such-topic')->assertNotFound();
});
