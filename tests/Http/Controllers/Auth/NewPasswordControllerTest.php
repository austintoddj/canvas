<?php

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

it('renders the reset password page', function (): void {
    $this->withoutMix();

    $this->get(route('canvas.password.reset', [
        'token' => Str::random(60),
    ]))
        ->assertSuccessful()
        ->assertViewIs('canvas::auth.passwords.reset')
        ->assertSeeText('Reset password');
});
it('resets the password', function (): void {
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
it('validates an invalid email on password reset', function (): void {
    $token = encrypt($this->admin->id.'|'.Str::random());

    $response = $this->post(route('canvas.password.update'), [
        'token' => $token,
        'email' => 'not-an-email',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('validates unconfirmed passwords on password reset', function (): void {
    $token = encrypt($this->admin->id.'|'.Str::random());

    $response = $this->post(route('canvas.password.update'), [
        'token' => $token,
        'email' => $this->admin->email,
        'password' => 'password',
        'password_confirmation' => 'secret',
    ]);

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('validates invalid tokens on password reset', function (): void {
    $this->post(route('canvas.password.update'), [
        'token' => Str::random(),
        'email' => $this->admin->email,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHas('invalidResetToken');
});
