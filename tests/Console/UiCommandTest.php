<?php

use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\File;

beforeEach(function (): void {
    TestCase::acquireCanvasUiScaffoldLock();

    File::deleteDirectory(app_path('Http/Controllers/Canvas'));
    File::delete(base_path('routes/canvas-ui.php'));
    File::deleteDirectory(resource_path('views/vendor/canvas/ui'));

    $webPath = base_path('routes/web.php');
    $this->webRoutesBackup = is_file($webPath) ? file_get_contents($webPath) : null;

    if (! is_dir(dirname($webPath))) {
        mkdir(dirname($webPath), 0755, true);
    }

    file_put_contents($webPath, "<?php\n\n// host web routes\n");
});

afterEach(function (): void {
    File::deleteDirectory(app_path('Http/Controllers/Canvas'));
    File::delete(base_path('routes/canvas-ui.php'));
    File::deleteDirectory(resource_path('views/vendor/canvas/ui'));

    $webPath = base_path('routes/web.php');

    if ($this->webRoutesBackup !== null) {
        file_put_contents($webPath, $this->webRoutesBackup);
    } elseif (is_file($webPath)) {
        unlink($webPath);
    }

    TestCase::releaseCanvasUiScaffoldLock();
});

it('exits successfully and points at the reader UI', function (): void {
    $this->artisan('canvas:ui')
        ->expectsOutputToContain('/canvas-ui')
        ->assertExitCode(0);
});

it('publishes all reader view files', function (): void {
    $this->artisan('canvas:ui');

    $base = resource_path('views/vendor/canvas/ui');

    foreach (['layout', 'index', 'show', 'tag', 'topic', 'tags', 'topics', 'author', 'feed'] as $view) {
        $this->assertFileExists("{$base}/{$view}.blade.php", "Missing view: {$view}.blade.php");
    }

    foreach (['author', 'embeds', 'meta', 'pagination', 'post-list-item', 'social-links'] as $partial) {
        $this->assertFileExists("{$base}/partials/{$partial}.blade.php", "Missing partial: {$partial}.blade.php");
    }
});

it('scaffolds the controller with the correct namespace', function (): void {
    $this->artisan('canvas:ui');

    $path = app_path('Http/Controllers/Canvas/CanvasUiController.php');

    $this->assertFileExists($path);
    $this->assertStringContainsString(
        'namespace App\Http\Controllers\Canvas;',
        file_get_contents($path)
    );
    $this->assertStringNotContainsString('{{namespace}}', file_get_contents($path));
});

it('scaffolds a controller with all reader methods', function (): void {
    $this->artisan('canvas:ui');

    $contents = file_get_contents(app_path('Http/Controllers/Canvas/CanvasUiController.php'));

    foreach (['index', 'feed', 'show', 'author', 'tags', 'tag', 'topics', 'topic'] as $method) {
        $this->assertStringContainsString(
            "public function {$method}",
            $contents,
            "Missing method: {$method}"
        );
    }
});

// Invariant: sample reader must not require HasCanvasAccess host relations
it('scaffolds a controller that does not require host canvasUser or posts relations', function (): void {
    $this->artisan('canvas:ui', ['--force' => true]);

    $contents = file_get_contents(app_path('Http/Controllers/Canvas/CanvasUiController.php'));

    expect($contents)
        ->not->toContain("with('user.canvasUser'")
        ->not->toContain("with('canvasUser')")
        ->not->toContain('$user->posts()')
        ->toContain('setRelation')
        ->toContain('CanvasUser::query()')
        ->toContain("where('user_id', \$canvasUser->user_id)");
});

it('scaffolds a controller that is syntactically valid PHP', function (): void {
    $this->artisan('canvas:ui');

    $path = app_path('Http/Controllers/Canvas/CanvasUiController.php');

    exec("php -l {$path} 2>&1", $output, $exitCode);

    $this->assertSame(0, $exitCode, implode("\n", $output));
});

it('creates the route stub with the canvas-ui prefix', function (): void {
    $this->artisan('canvas:ui');

    $contents = file_get_contents(base_path('routes/canvas-ui.php'));

    $this->assertStringContainsString("prefix('canvas-ui')", $contents);
});

it('creates the route stub with all named routes', function (): void {
    $this->artisan('canvas:ui');

    $contents = file_get_contents(base_path('routes/canvas-ui.php'));

    foreach ([
        'canvas-ui.index',
        'canvas-ui.feed',
        'canvas-ui.show',
        'canvas-ui.author',
        'canvas-ui.tags',
        'canvas-ui.tag',
        'canvas-ui.topics',
        'canvas-ui.topic',
    ] as $name) {
        $this->assertStringContainsString($name, $contents, "Missing named route: {$name}");
    }

    $this->assertStringContainsString('/feed', $contents);
    $this->assertTrue(
        strpos($contents, "Route::get('/feed'") < strpos($contents, "Route::get('/{slug}'"),
        'Feed route must be registered before the slug catch-all'
    );
});

it('registers the canvas-ui routes require in routes/web.php', function (): void {
    $this->artisan('canvas:ui')
        ->assertExitCode(0);

    $contents = file_get_contents(base_path('routes/web.php'));

    expect($contents)
        ->toContain("require __DIR__.'/canvas-ui.php';")
        ->toContain('// host web routes');
});

it('does not duplicate the canvas-ui require on re-run', function (): void {
    $this->artisan('canvas:ui')->assertExitCode(0);
    $this->artisan('canvas:ui')->assertExitCode(0);

    $contents = file_get_contents(base_path('routes/web.php'));

    expect(substr_count($contents, 'canvas-ui.php'))->toBe(1);
});

it('warns when the controller already exists and --force is not passed', function (): void {
    $this->artisan('canvas:ui');

    $this->artisan('canvas:ui')
        ->expectsOutputToContain('already exists')
        ->assertExitCode(0);
});

it('overwrites existing files when --force is passed', function (): void {
    $this->artisan('canvas:ui');

    $firstContents = file_get_contents(app_path('Http/Controllers/Canvas/CanvasUiController.php'));

    $this->artisan('canvas:ui', ['--force' => true])
        ->assertExitCode(0);

    $this->assertFileExists(app_path('Http/Controllers/Canvas/CanvasUiController.php'));
    $this->assertSame($firstContents, file_get_contents(app_path('Http/Controllers/Canvas/CanvasUiController.php')));
});

it('warns when routes/web.php is missing', function (): void {
    unlink(base_path('routes/web.php'));

    $this->artisan('canvas:ui')
        ->expectsOutputToContain('routes/web.php not found')
        ->assertExitCode(0);

    $this->assertFileExists(base_path('routes/canvas-ui.php'));
});
