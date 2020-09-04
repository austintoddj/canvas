<?php

namespace Canvas\Tests\Models;

use Canvas\Http\Middleware\Session;
use Canvas\Models\UserMeta;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class UserMetaTest.
 *
 * @covers \Canvas\Models\UserMeta
 */
class UserMetaTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            Authorize::class,
            Session::class,
            VerifyCsrfToken::class,
        ]);
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
    public function role_is_cast_to_an_integer()
    {
        $meta = factory(UserMeta::class)->create();

        $this->assertIsInt($meta->role);
    }

    /** @test */
    public function user_relationship()
    {
        $meta = factory(UserMeta::class)->create();

        $this->assertInstanceOf(BelongsTo::class, $meta->user());
        $this->assertInstanceOf(config('canvas.user'), $meta->user);
    }

    /** @test */
    public function contributor_attribute()
    {
        $meta = factory(UserMeta::class)->create([
            'role' => UserMeta::CONTRIBUTOR,
        ]);

        $this->assertTrue($meta->isContributor);
    }

    /** @test */
    public function editor_attribute()
    {
        $meta = factory(UserMeta::class)->create([
            'role' => UserMeta::EDITOR,
        ]);

        $this->assertTrue($meta->isEditor);
    }

    /** @test */
    public function admin_attribute()
    {
        $meta = factory(UserMeta::class)->create([
            'role' => UserMeta::ADMIN,
        ]);

        $this->assertTrue($meta->isAdmin);
    }
}
