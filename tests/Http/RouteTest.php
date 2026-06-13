<?php

use Canvas\Canvas;
use Illuminate\Support\Facades\Config;

it('registers a named route', function (): void {
    $this->assertEquals(
        url(config('canvas.path')),
        route('canvas')
    );
});
it('uses the route with the default base path', function (): void {
    $this->actingAs($this->admin)
        ->get(route('canvas'))
        ->assertRedirect(route('canvas.login'))
        ->assertLocation('http://laravel.test/canvas/login');

    $this->assertSame(Canvas::basePath(), '/canvas');
});
it('uses the route with a subdomain and default base path', function (): void {
    Config::set('canvas.domain', 'http://canvas.laravel.test');

    $this->actingAs($this->admin)
        ->get(config('canvas.domain').'/canvas')
        ->assertRedirect(route('canvas.login'))
        ->assertLocation('http://canvas.laravel.test/canvas/login');

    $this->assertSame(Canvas::basePath(), '/canvas');
});
it('uses the route with a subdomain and null base path', function (): void {
    Config::set('canvas.path', null);

    Config::set('canvas.domain', 'http://canvas.laravel.test');

    $this->actingAs($this->admin)
        ->get(config('canvas.domain').'/canvas')
        ->assertRedirect(route('canvas.login'));

    $this->assertSame(Canvas::basePath(), '/');
});
