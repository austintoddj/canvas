<?php

namespace Canvas\Tests\Http;

use Canvas\Tests\TestCase;

class RouteTest extends TestCase
{
    /** @test */
    public function named_route()
    {
        $this->assertEquals(
            url(config('canvas.path')),
            route('canvas')
        );
    }
}
