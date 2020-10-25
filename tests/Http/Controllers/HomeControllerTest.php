<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Tests\TestCase;
use Exception;

/**
 * Class HomeControllerTest.
 *
 * @covers \Canvas\Http\Controllers\HomeController
 */
class HomeControllerTest extends TestCase
{
    /**
     * @return void
     * @throws Exception
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function testScriptVariables(): void
    {
        $this->withoutMix();

        $this->actingAs($this->admin, 'canvas')
             ->get(config('canvas.path'))
             ->assertSuccessful()
             ->assertViewIs('canvas::layout')
             ->assertViewHas('config')
             ->assertSee('canvas');
    }
}
