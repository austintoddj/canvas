<?php

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

it('the reset password page', function (): void {
    $this->withoutMix();

    $this->get(route('canvas.password.reset', [
        'token' => Str::random(60),
    ]))
        ->assertSuccessful()
        ->assertViewIs('canvas::auth.passwords.reset')
        ->assertSeeText('Reset password');
});
it('password can be reset', function (): void {
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
});
it('new password request will validate an invalid email', function (): void {
    $token = encrypt($this->admin->id.'|'.Str::random());

    $response = $this->post(route('canvas.password.update'), [
        'token' => $token,
        'email' => 'not-an-email',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('new password request will validate unconfirmed passwords', function (): void {
    $token = encrypt($this->admin->id.'|'.Str::random());

    $response = $this->post(route('canvas.password.update'), [
        'token' => $token,
        'email' => $this->admin->email,
        'password' => 'password',
        'password_confirmation' => 'secret',
    ]);

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('new password request will validate bad tokens', function (): void {
    $this->post(route('canvas.password.update'), [
        'token' => Str::random(),
        'email' => $this->admin->email,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHas('invalidResetToken');
});
