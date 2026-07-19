<?php

use Illuminate\Support\Facades\File;

afterEach(function (): void {
    File::deleteDirectory(app_path('Http/Controllers/Canvas'));
    File::delete(base_path('routes/canvas-ui.php'));
    File::deleteDirectory(resource_path('views/vendor/canvas/ui'));
});

it('exits successfully and outputs the install message', function (): void {
    $this->artisan('canvas:ui')
        ->expectsOutputToContain('Canvas reader UI installed successfully.')
        ->assertExitCode(0);
});

it('publishes all reader view files', function (): void {
    $this->artisan('canvas:ui');

    $base = resource_path('views/vendor/canvas/ui');

    foreach (['layout', 'index', 'show', 'tag', 'topic', 'tags', 'topics', 'author', 'feed'] as $view) {
        $this->assertFileExists("{$base}/{$view}.blade.php", "Missing view: {$view}.blade.php");
    }

    foreach (['author', 'meta', 'pagination', 'post-list-item', 'social-links'] as $partial) {
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

it('mentions that HasCanvasAccess is optional', function (): void {
    $this->artisan('canvas:ui', ['--force' => true])
        ->expectsOutputToContain('HasCanvasAccess on your User model is optional')
        ->assertExitCode(0);
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
