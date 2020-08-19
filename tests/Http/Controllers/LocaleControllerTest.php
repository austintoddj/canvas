<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class LocaleControllerTest.
 *
 * @covers \Canvas\Http\Controllers\LocaleController
 */
class LocaleControllerTest extends TestCase
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
    public function it_can_fetch_translations_for_a_given_locale()
    {
        $user = factory(config('canvas.user'))->create();
        $code = config('app.locale');

        $response = $this->actingAs($user)->getJson("canvas/api/locale/{$code}")->assertSuccessful();

        $this->assertArrayHasKey('app', $response->decodeResponseJson());
    }
}
