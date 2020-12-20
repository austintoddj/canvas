<?php

namespace Canvas\Tests\Http;

use Canvas\Canvas;
use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Config;

class RouteTest extends TestCase
{
    public function testNamedRoute(): void
    {
        $this->assertEquals(
            url(config('canvas.path')),
            route('canvas')
        );
    }

    public function testRouteWithDefaultBasePath(): void
    {
        $this->markTestSkipped();

        $this->actingAs($this->admin)
             ->get(sprintf('%s', config('canvas.path')))
             ->assertRedirect(route('canvas.login'))
             ->assertLocation('http://laravel.test/canvas/login');

        $this->assertSame(Canvas::basePath(), '/'.config('canvas.path'));
    }

    public function testRouteWithSubdomainAndDefaultBasePath(): void
    {
        $this->markTestSkipped();

        Config::set('canvas.domain', 'http://canvas.laravel.test');

        $this->actingAs($this->admin)
             ->get(sprintf('%s/%s', config('canvas.domain'), config('canvas.path')))
             ->assertRedirect(route('canvas.login'))
             ->assertLocation('http://canvas.laravel.test/canvas/login');

        $this->assertSame(Canvas::basePath(), '/'.config('canvas.path'));
    }

    public function testRouteWithSubdomainAndNullBasePath(): void
    {
        $this->markTestSkipped();

        Config::set('canvas.path', null);

        Config::set('canvas.domain', 'http://canvas.laravel.test');

        $this->actingAs($this->admin)
             ->get(config('canvas.domain'))
             ->assertRedirect(route('canvas.login'))
             ->assertLocation('http://canvas.laravel.test/login');

        $this->assertSame(Canvas::basePath(), '/');
    }

    public function testBasePathWithSubdomain(): void
    {
        $this->markTestSkipped();

        Config::set('canvas.path', 'admin');

        Config::set('canvas.domain', 'http://canvas.laravel.test');

        $this->actingAs($this->admin)
             ->get(sprintf('%s/%s', config('canvas.domain'), config('canvas.path')))
             ->assertRedirect(route('canvas.login'))
             ->assertLocation('http://canvas.laravel.test/blog/login');

        $this->assertSame(Canvas::basePath(), '/admin');
    }
}
