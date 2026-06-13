<?php

use Canvas\Mail\ResetPassword;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

it('renders the forgot password page', function (): void {
    $this->withoutMix();

    $this->get(route('canvas.password.request'))
        ->assertSuccessful()
        ->assertViewIs('canvas::auth.passwords.email')
        ->assertSeeText('Send Password Reset Link');
});
it('validates an invalid email for forgot-password links', function (): void {
    $response = $this->post(route('canvas.password.email'), [
        'email' => 'not-an-email',
    ]);

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('sends a password reset link', function (): void {
    Mail::fake();

    $this->post(route('canvas.password.email'), [
        'email' => $this->admin->email,
    ])
        ->assertRedirect(route('canvas.password.request'));

    Mail::assertSent(ResetPassword::class, function ($mail) {
        $this->assertIsString($mail->token);

        return $mail->hasTo($this->admin->email);
    });
});
