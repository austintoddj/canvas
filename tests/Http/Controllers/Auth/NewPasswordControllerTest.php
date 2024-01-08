<?php

namespace Canvas\Tests\Http\Controllers\Auth;

use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Class NewPasswordControllerTest.
 *
 * @covers \Canvas\Http\Controllers\Auth\NewPasswordController
 * @covers \Canvas\Http\Requests\NewPasswordRequest
 */
class NewPasswordControllerTest extends TestCase
{
    public function testTheResetPasswordPage(): void
    {
        $this->withoutMix();

        $user = User::factory()->create();

        $this->get(route('canvas.reset-password.view', [
            'token' => encrypt($user->id.'|'.Str::random()),
        ]))
             ->assertSuccessful()
             ->assertViewIs('canvas::auth.passwords.reset')
             ->assertSeeText(trans('canvas::app.update_password'));
    }

    public function testPasswordCanBeReset(): void
    {
        $this->withoutMix();

        $user = User::factory()->create();

        $token = encrypt($user->id.'|'.Str::random());

        cache(["password.reset.{$user->id}" => $token],
            now()->addMinutes(60)
        );

        $this->post(route('canvas.reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]))->assertRedirect(route('canvas'));

        $this->assertEmpty(cache("password.reset.{$user->id}"));
    }

    public function testNewPasswordRequestWillValidateAnInvalidEmail(): void
    {
        $user = User::factory()->create();

        $response = $this->post(route('canvas.reset-password'), [
            'token' => encrypt($user->id.'|'.Str::random()),
            'email' => 'not-an-email',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertInstanceOf(ValidationException::class, $response->exception);
    }

    public function testNewPasswordRequestWillValidateUnconfirmedPasswords(): void
    {
        $user = User::factory()->create();

        $response = $this->post(route('canvas.reset-password'), [
            'token' => encrypt($user->id.'|'.Str::random()),
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'secret',
        ]);

        $this->assertInstanceOf(ValidationException::class, $response->exception);
    }

    public function testNewPasswordRequestWillValidateExpiredTokens(): void
    {
        $user = User::factory()->create();

        $oldToken = encrypt($user->id.'|'.Str::random());

        cache(["password.reset.{$user->id}" => $oldToken],
            now()->subMinute()
        );

        $this->post(route('canvas.reset-password'), [
            'token' => $oldToken,
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHas('invalidResetToken');
    }
}
