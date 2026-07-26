<?php

use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Schema;

it('exits successfully and outputs the install messages', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:install')
            ->assertExitCode(0)
            ->expectsOutputToContain('canvas:make-admin')
            ->expectsOutputToContain('/canvas');
    });
});

it('publishes the config file', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:install');

        $this->assertFileExists(config_path('canvas.php'));
    });
});

it('links public storage', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $link = public_path('storage');

        if (is_link($link) || file_exists($link)) {
            unlink($link);
        }

        $this->artisan('canvas:install')->assertExitCode(0);

        expect(is_link($link))->toBeTrue();
    });
});

it('does not publish a host CanvasServiceProvider', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $path = app_path('Providers/CanvasServiceProvider.php');

        if (file_exists($path)) {
            unlink($path);
        }

        $this->artisan('canvas:install');

        $this->assertFileDoesNotExist($path);
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
