<?php

namespace Canvas\Tests\Http\Controllers\Auth;

use Canvas\Tests\TestCase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Class NewPasswordControllerTest.
 *
 * @covers \Canvas\Http\Controllers\Auth\NewPasswordController
 */
class NewPasswordControllerTest extends TestCase
{
    public function testTheResetPasswordPage(): void
    {
        $this->withoutMix();

        $this->get(route('canvas.password.reset', [
            'token' => Str::random(60),
        ]))
             ->assertSuccessful()
             ->assertViewIs('canvas::auth.passwords.reset')
             ->assertSeeText('Reset password');
    }

    public function testPasswordCanBeReset(): void
    {
        $this->withoutMix();

        $token = encrypt($this->admin->id.'|'.Str::random());

        cache(["password.reset.{$this->admin->id}" => $token],
            now()->addMinutes(60)
        );

        $this->post(route('canvas.password.update', [
            'token' => $token,
            'email' => $this->admin->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]))->assertRedirect(route('canvas'));

        $this->assertEmpty(cache()->get("password.reset.{$this->admin->id}"));
    }

    public function testNewPasswordRequestWillValidateAnInvalidEmail(): void
    {
        $token = encrypt($this->admin->id.'|'.Str::random());

        $response = $this->post(route('canvas.password.update'), [
            'token' => $token,
            'email' => 'not-an-email',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors();

        $this->assertInstanceOf(ValidationException::class, $response->exception);
    }

    public function testNewPasswordRequestWillValidateUnconfirmedPasswords(): void
    {
        $token = encrypt($this->admin->id.'|'.Str::random());

        $response = $this->post(route('canvas.password.update'), [
            'token' => $token,
            'email' => $this->admin->email,
            'password' => 'password',
            'password_confirmation' => 'secret',
        ]);

        $this->assertInstanceOf(ValidationException::class, $response->exception);
    }

    public function testNewPasswordRequestWillValidateBadTokens(): void
    {
        $this->post(route('canvas.password.update'), [
            'token' => Str::random(),
            'email' => $this->admin->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHas('invalidResetToken');
    }
}
