<?php

use Canvas\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

it('the login page', function (): void {
    $this->withoutMix();

    $this->get(route('canvas.login'))
        ->assertSuccessful()
        ->assertViewIs('canvas::auth.login')
        ->assertSeeText('Please sign in');
});
it('login request will validate an invalid email', function (): void {
    $response = $this->post('/canvas/login', [
        'email' => 'not-an-email',
        'password' => 'password',
    ])->assertRedirect(route('canvas.login'));

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('login request will validate an unknown password', function (): void {
    $response = $this->post('/canvas/login', [
        'email' => $this->admin->email,
        'password' => 'what-is-my-password',
    ])->assertSessionHasErrors();

    $this->assertInstanceOf(ValidationException::class, $response->exception);
});
it('successful login', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);

    $this->post('/canvas/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(config('canvas.path'));
});
it('authenticated user will redirect to canvas', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->get('canvas/login')
        ->assertRedirect(config('canvas.path'));
});
it('successful logout', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->get(route('canvas.logout'))
        ->assertRedirect(route('canvas.login'));
});
