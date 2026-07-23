<?php

use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Schema;

it('exits successfully and outputs the install messages', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:install')
            ->assertExitCode(0)
            ->expectsOutputToContain('Installation complete')
            ->expectsOutputToContain('canvas:make-admin');
    });
});

it('publishes the config file', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:install');

        $this->assertFileExists(config_path('canvas.php'));
    });
});

it('publishes the service provider stub without host digest scheduling', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $path = app_path('Providers/CanvasServiceProvider.php');

        if (file_exists($path)) {
            unlink($path);
        }

        $this->artisan('canvas:install');

        $contents = file_get_contents($path);

        $this->assertFileExists($path);
        $this->assertStringContainsString('class CanvasServiceProvider', $contents);
        $this->assertStringNotContainsString('canvas:digest', $contents);
    });
});

it('creates all canvas database tables', function (string $table): void {
    TestCase::withSharedTestbenchLock(function () use ($table): void {
        $this->artisan('canvas:install');

        expect(Schema::hasTable($table))->toBeTrue();
    });
})->with([
    'canvas_posts',
    'canvas_tags',
    'canvas_topics',
    'canvas_posts_tags',
    'canvas_views',
    'canvas_visits',
    'canvas_users',
    'canvas_media',
    'canvas_settings',
]);
