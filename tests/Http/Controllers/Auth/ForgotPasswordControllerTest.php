<?php

namespace Canvas\Tests\Http\Controllers\Auth;

use Canvas\Mail\ResetPassword;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Mail;

/**
 * Class ForgotPasswordControllerTest.
 *
 * @covers \Canvas\Http\Controllers\Auth\ForgotPasswordController
 */
class ForgotPasswordControllerTest extends TestCase
{
    /** @test */
    public function it_can_show_the_forgot_password_page()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $this->actingAs($user, 'canvas')
             ->get(route('canvas.password.request'))
             ->assertSuccessful()
             ->assertViewIs('canvas::auth.passwords.email')
             ->assertSeeText('Send Password Reset Link');
    }

    /** @test */
    public function it_can_send_a_password_reset_link()
    {
        Mail::fake();

        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $this->actingAs($user, 'canvas')
             ->post(route('canvas.password.email'), [
                 'email' => $user->email,
             ])
             ->assertRedirect(route('canvas.password.request'));

        Mail::assertSent(ResetPassword::class, function ($mail) use ($user) {
            $this->assertIsString($mail->token);

            return $mail->hasTo($user->email);
        });
    }
}
