<?php

use App\Http\Controllers\Canvas\CanvasUiController;
use Canvas\Enums\Role;
use Canvas\Events\PostViewed;
use Canvas\Http\Middleware\Session;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Tests\Models\BareUser;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    static $controllerLoaded = false;

    if (! $controllerLoaded) {
        $controllerPath = app_path('Http/Controllers/Canvas/CanvasUiController.php');
        $lock = fopen(sys_get_temp_dir().'/canvas-test-ui.lock', 'c');

        if ($lock !== false) {
            flock($lock, LOCK_EX);
        }

        try {
            $this->artisan('canvas:ui', ['--force' => true]);

            if (function_exists('opcache_invalidate')) {
                opcache_invalidate($controllerPath, true);
            }

            require_once $controllerPath;
            $controllerLoaded = true;
        } finally {
            if ($lock !== false) {
                flock($lock, LOCK_UN);
                fclose($lock);
            }
        }
    }

    Route::prefix('canvas-ui')->middleware(['web'])->group(function (): void {
        Route::get('/', [CanvasUiController::class, 'index'])
            ->name('canvas-ui.index');

        Route::get('/tags', [CanvasUiController::class, 'tags'])
            ->name('canvas-ui.tags');

        Route::get('/topics', [CanvasUiController::class, 'topics'])
            ->name('canvas-ui.topics');

        Route::get('/tags/{slug}', [CanvasUiController::class, 'tag'])
            ->name('canvas-ui.tag');

        Route::get('/topics/{slug}', [CanvasUiController::class, 'topic'])
            ->name('canvas-ui.topic');

        Route::get('/@{username}', [CanvasUiController::class, 'author'])
            ->where('username', '[A-Za-z0-9_-]+')
            ->name('canvas-ui.author');

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

it('shows an author page with published posts only', function (): void {
    $username = $this->admin->canvasUser->username;

    Post::factory()->count(2)->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ]);

    $response = $this->get("canvas-ui/@{$username}")
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.author')
        ->assertViewHas('user', fn ($user) => $user->id === $this->admin->id)
        ->assertViewHas('posts');

    $this->assertSame(2, $response->viewData('posts')->total());
});

it('returns 404 for an unknown author username', function (): void {
    $this->get('canvas-ui/@no-such-author')->assertNotFound();
});

it('renders author avatars on the index from canvas_users instead of host email gravatar', function (): void {
    $avatarHash = 'custom-avatar-hash';
    $this->admin->canvasUser->update(['avatar' => $avatarHash]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $emailGravatar = md5(strtolower(trim($this->admin->email)));

    $response = $this->get('canvas-ui')->assertSuccessful();

    expect($response->getContent())
        ->toContain($avatarHash)
        ->not->toContain($emailGravatar);
});

it('renders author avatars on the post page from canvas_users instead of host email gravatar', function (): void {
    $avatarHash = 'custom-avatar-hash';
    $this->admin->canvasUser->update(['avatar' => $avatarHash]);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $emailGravatar = md5(strtolower(trim($this->admin->email)));

    $response = $this->get("canvas-ui/{$post->slug}")->assertSuccessful();

    expect($response->getContent())
        ->toContain($avatarHash)
        ->not->toContain($emailGravatar);
});

it('links author names to the author page when a username is set', function (): void {
    $username = $this->admin->canvasUser->username;

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $this->get('canvas-ui')
        ->assertSuccessful()
        ->assertSee(route('canvas-ui.author', $username), false);
});

it('shows a tags index with published post counts', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->admin->id, 'name' => 'Alpha']);

    $published = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $draft = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => null,
    ]);

    $tag->posts()->attach([$published->id, $draft->id]);

    $this->get('canvas-ui/tags')
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.tags')
        ->assertViewHas('tags')
        ->assertSee('Alpha')
        ->assertSee('1 post');
});

it('shows a topics index with published post counts', function (): void {
    $topic = Topic::factory()->create(['user_id' => $this->admin->id, 'name' => 'Engineering']);

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

    $this->get('canvas-ui/topics')
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.topics')
        ->assertViewHas('topics')
        ->assertSee('Engineering')
        ->assertSee('2 posts');
});

it('shows social links on the author page', function (): void {
    $this->admin->canvasUser->update([
        'social' => ['x' => 'canvaswriter'],
    ]);

    $this->get('canvas-ui/@'.$this->admin->canvasUser->username)
        ->assertSuccessful()
        ->assertSee('https://x.com/canvaswriter', false);
});

it('shows authors on tag listing pages', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->admin->id]);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subDay(),
    ]);

    $tag->posts()->attach($post->id);

    $this->get("canvas-ui/tags/{$tag->slug}")
        ->assertSuccessful()
        ->assertSee($this->admin->name);
});

// Invariant: sample reader works with bare host users (no HasCanvasAccess)
it('renders the reader for bare host users without canvas relations', function (): void {
    config()->set('canvas.user_model', BareUser::class);

    $host = User::factory()->create([
        'name' => 'Bare Reader Author',
        'email' => 'bare-reader@example.com',
    ]);

    CanvasUser::factory()->create([
        'user_id' => $host->id,
        'role' => Role::Contributor,
        'username' => 'bare-reader',
        'avatar' => 'bare-avatar-hash',
        'summary' => 'Writes without a trait',
    ]);

    $post = Post::factory()->create([
        'user_id' => $host->id,
        'published_at' => now()->subDay(),
        'title' => 'Bare Host Post',
    ]);

    $this->get('canvas-ui')
        ->assertSuccessful()
        ->assertSee('Bare Host Post')
        ->assertSee('Bare Reader Author')
        ->assertSee('bare-avatar-hash');

    $this->get("canvas-ui/{$post->slug}")
        ->assertSuccessful()
        ->assertSee('Bare Host Post')
        ->assertSee('Bare Reader Author');

    $this->get('canvas-ui/@bare-reader')
        ->assertSuccessful()
        ->assertViewIs('canvas::ui.author')
        ->assertSee('Bare Reader Author')
        ->assertSee('Writes without a trait')
        ->assertSee('Bare Host Post');
});
