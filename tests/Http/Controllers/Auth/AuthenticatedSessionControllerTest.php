<?php

use Canvas\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

it('renders the login page', function (): void {
    $this->withoutMix();

    $this->get(route('canvas.login'))
        ->assertSuccessful()
        ->assertViewIs('canvas::auth.login')
        ->assertSeeText('Please sign in');
});
it('validates an invalid email on login', function (): void {
    $response = $this->post('/canvas/login', [
        'email' => 'not-an-email',
        'password' => 'password',
    ])->assertRedirect(route('canvas.login'));

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('validates an unknown password on login', function (): void {
    $response = $this->post('/canvas/login', [
        'email' => $this->admin->email,
        'password' => 'what-is-my-password',
    ])->assertSessionHasErrors();

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('logs in successfully', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);

    $this->post('/canvas/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(config('canvas.path'));
});
it('redirects authenticated users to canvas', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->get('canvas/login')
        ->assertRedirect(config('canvas.path'));
});
it('logs out successfully', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->post(route('canvas.logout'))
        ->assertRedirect(route('canvas.login'));
});
