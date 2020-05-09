<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Canvas\UserMeta;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserMetaTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);
    }

    /** @test */
    public function digest_is_cast_to_a_boolean()
    {
        $meta = factory(UserMeta::class)->create();

        $this->assertIsBool($meta->digest);
    }

    /** @test */
    public function dark_mode_is_cast_to_a_boolean()
    {
        $meta = factory(UserMeta::class)->create();

        $this->assertIsBool($meta->dark_mode);
    }

    /** @test */
    public function user_relationship()
    {
        $meta = factory(UserMeta::class)->create();

        $this->assertInstanceOf(config('canvas.user'), $meta->user);
    }

    /** @test */
    public function for_user_scope()
    {
        $user = factory(config('canvas.user'))->create();

        $meta = factory(UserMeta::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertEquals(1, $meta->forUser($user)->count());
    }
}
