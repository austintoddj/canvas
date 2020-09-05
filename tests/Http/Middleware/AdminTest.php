<?php

namespace Canvas\Tests\Http\Middleware;

use Canvas\Models\User;
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
    public function protectedRoutesProvider(): array
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
     * @dataProvider protectedRoutesProvider
     * @param $method
     * @param $endpoint
     */
    public function it_restricts_contributors_access($method, $endpoint)
    {
        $user = factory(User::class)->create([
            'role' => User::CONTRIBUTOR,
        ]);

        $this->actingAs($user)->call($method, $endpoint)->assertForbidden();
    }

    /**
     * @test
     * @dataProvider protectedRoutesProvider
     * @param $method
     * @param $endpoint
     */
    public function it_restricts_editors_access($method, $endpoint)
    {
        $user = factory(User::class)->create([
            'role' => User::EDITOR,
        ]);

        $this->actingAs($user)->call($method, $endpoint)->assertForbidden();
    }
}
