<?php

declare(strict_types=1);

use App\Http\Controllers\Canvas\CanvasUiController;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    TestCase::acquireCanvasUiScaffoldLock();
    config(['canvas.content' => ['enabled' => true, 'locales' => ['en', 'ru', 'de'], 'default_locale' => 'en', 'fallback' => true]]);
    $this->artisan('canvas:ui', ['--force' => true])->assertSuccessful();
    if (! class_exists(CanvasUiController::class, false)) {
        require_once app_path('Http/Controllers/Canvas/CanvasUiController.php');
    }
    require dirname(__DIR__).'/resources/stubs/routes/canvas-ui.stub';
    Route::getRoutes()->refreshNameLookups();
});

afterEach(function (): void {
    TestCase::releaseCanvasUiScaffoldLock();
});

it('renders language URLs with a shared slug and canonicalizes fallback content', function (): void {
    $post = Post::factory()->create(['meta' => null, 'title' => 'English article', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Русская статья', 'published_at' => null])->save();
    $this->get('/canvas-ui/ru/'.$post->slug)->assertOk()->assertSee('English article')
        ->assertSee('lang="en"', false)->assertSee('/canvas-ui/en/'.$post->slug)->assertDontSee('Русская статья');
    $post->inLocale('ru')->fill(['published_at' => now()->subHour()])->save();
    $this->get('/canvas-ui/ru/'.$post->slug)->assertOk()->assertSee('Русская статья')->assertSee('lang="ru"', false)
        ->assertSee('hreflang="en"', false);
    $this->get('/canvas-ui/'.$post->slug)->assertRedirect('/canvas-ui/en/'.$post->slug);
    $this->get('/canvas-ui/xx/'.$post->slug)->assertNotFound();
});

it('does not expose drafts in localized feeds and rejects missing content without fallback', function (): void {
    $post = Post::factory()->create(['meta' => null, 'title' => 'English article', 'published_at' => now()->subDay()]);
    $post->inLocale('ru')->fill(['title' => 'Draft secret', 'published_at' => now()->addDay()])->save();
    $this->get('/canvas-ui/ru/feed')->assertOk()->assertSee('English article')->assertDontSee('Draft secret');
    config(['canvas.content.fallback' => false]);
    $this->get('/canvas-ui/ru/'.$post->slug)->assertNotFound();
    $this->get('/canvas-ui/de')->assertOk()->assertDontSee('English article');
});
