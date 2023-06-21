<?php

namespace Canvas\Tests\Http\Middleware;

use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class AuthorizeTest.
 *
 * @covers \Canvas\Http\Middleware\Authenticate
 */
class AuthenticateTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array
     */
    public function protectedRoutesProvider(): array
    {
        return [
            // Base routes...
            ['GET', 'canvas'],
            ['GET', 'canvas/api'],

            // Upload routes...
            ['POST', 'canvas/api/uploads'],
            ['DELETE', 'canvas/api/uploads'],

            // Post routes...
            ['GET', 'canvas/api/posts'],
            ['GET', 'canvas/api/posts/create'],
            ['GET', 'canvas/api/posts/{id}'],
            ['GET', 'canvas/api/posts/{id}/stats'],
            ['POST', 'canvas/api/posts/{id}'],
            ['DELETE', 'canvas/api/posts/{id}'],

            // Tag routes...
            ['GET', 'canvas/api/tags'],
            ['GET', 'canvas/api/tags/create'],
            ['GET', 'canvas/api/tags/{id}'],
            ['GET', 'canvas/api/tags/{id}/posts'],
            ['POST', 'canvas/api/tags/{id}'],
            ['DELETE', 'canvas/api/tags/{id}'],

            // Topic routes...
            ['GET', 'canvas/api/topics'],
            ['GET', 'canvas/api/topics/create'],
            ['GET', 'canvas/api/topics/{id}'],
            ['GET', 'canvas/api/topics/{id}/posts'],
            ['POST', 'canvas/api/topics/{id}'],
            ['DELETE', 'canvas/api/topics/{id}'],

            // User routes...
            ['GET', 'canvas/api/users'],
            ['GET', 'canvas/api/users/create'],
            ['GET', 'canvas/api/users/{id}'],
            ['GET', 'canvas/api/users/{id}/posts'],
            ['POST', 'canvas/api/users/{id}'],
            ['DELETE', 'canvas/api/users/{id}'],

            // Search routes...
            ['GET', 'canvas/api/search/posts'],
            ['GET', 'canvas/api/search/tags'],
            ['GET', 'canvas/api/search/topics'],
            ['GET', 'canvas/api/search/users'],
        ];
    }

    /**
     * @dataProvider protectedRoutesProvider
     *
     * @param  $method
     * @param  $endpoint
     */
    public function testUnauthenticatedUsersAreRedirectedToLogin($method, $endpoint): void
    {
        $this->assertGuest()
             ->call($method, $endpoint)
             ->assertRedirect(route('canvas.login'));
    }

    /** @test */
    public function testAuthenticatedUsersAreRedirectedToCanvas()
    {
        $this->actingAs($this->admin, 'canvas')
             ->get(route('canvas.login'))
             ->assertRedirect(config('canvas.path'));

        $this->actingAs($this->admin, 'canvas')
             ->get('canvas/api')
             ->assertSuccessful();
    }
}
