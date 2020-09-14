<?php

namespace Canvas\Tests\Http\Controllers\Auth;

use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Support\Str;

/**
 * Class ResetPasswordControllerTest.
 *
 * @covers \Canvas\Http\Controllers\Auth\ResetPasswordController
 */
class ResetPasswordControllerTest extends TestCase
{
    /** @test */
    public function it_can_show_the_reset_password_page()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $this->actingAs($user, 'canvas')
             ->get(route('canvas.password.reset', [
                 'token' => Str::random(60),
             ]))
             ->assertSuccessful()
             ->assertViewIs('canvas::auth.passwords.reset')
             ->assertSeeText('Reset password');
    }
}
