<?php

namespace Canvas\Tests\Http\Middleware;

use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class AdminTest.
 *
 * @covers \Canvas\Http\Middleware\Admin
 */
class AdminTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array
     */
    public function restrictedRoutesProvider(): array
    {
        return [
            ['GET', 'canvas/api/tags'],
            ['GET', 'canvas/api/topics'],
            ['GET', 'canvas/api/users'],
            ['GET', 'canvas/api/tags/create'],
            ['GET', 'canvas/api/topics/create'],
            ['GET', 'canvas/api/search/tags'],
            ['GET', 'canvas/api/search/topics'],
            ['GET', 'canvas/api/search/users'],
            ['POST', 'canvas/api/tags/not-a-tag'],
            ['POST', 'canvas/api/topics/not-a-topic'],
            ['DELETE', 'canvas/api/tags/not-a-tag'],
            ['DELETE', 'canvas/api/topics/not-a-topic'],
        ];
    }

    /**
     * @test
     * @dataProvider restrictedRoutesProvider
     * @param $method
     * @param $endpoint
     */
    public function it_restricts_access_to_non_admins($method, $endpoint)
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->call($method, $endpoint)->assertForbidden();
    }
}
