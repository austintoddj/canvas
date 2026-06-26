<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

afterEach(function (): void {
    File::delete(config_path('canvas.php'));
    File::delete(app_path('Providers/CanvasServiceProvider.php'));
});

it('exits successfully and outputs the install messages', function (): void {
    $this->artisan('canvas:install')
        ->assertExitCode(0)
        ->expectsOutput('Installation complete.')
        ->expectsOutputToContain('canvas:make-admin');
});

it('publishes the config file', function (): void {
    $this->artisan('canvas:install');

    $this->assertFileExists(config_path('canvas.php'));
});

it('publishes the service provider stub with the digest schedule', function (): void {
    $this->artisan('canvas:install');

    $path = app_path('Providers/CanvasServiceProvider.php');

    $this->assertFileExists($path);
    $this->assertStringContainsString('canvas:digest', file_get_contents($path));
});

it('creates all canvas database tables', function (string $table): void {
    $this->artisan('canvas:install');

    expect(Schema::hasTable($table))->toBeTrue();
})->with([
    'canvas_posts',
    'canvas_tags',
    'canvas_topics',
    'canvas_posts_tags',
    'canvas_views',
    'canvas_visits',
    'canvas_users',
]);
