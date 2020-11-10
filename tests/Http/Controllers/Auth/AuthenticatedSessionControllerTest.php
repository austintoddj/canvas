<?php

namespace Canvas\Tests\Http\Controllers\Auth;

use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Hash;

/**
 * Class AuthenticatedSessionControllerTest.
 *
 * @covers \Canvas\Http\Controllers\Auth\AuthenticatedSessionController
 * @covers \Canvas\Http\Requests\LoginRequest
 */
class AuthenticatedSessionControllerTest extends TestCase
{
    public function testTheLoginPage(): void
    {
        $this->withoutMix();

        $this->get(route('canvas.login'))
             ->assertSuccessful()
             ->assertViewIs('canvas::auth.login')
             ->assertSeeText('Please sign in');
    }

    public function testLoginRequestWillValidateAnInvalidEmail(): void
    {
        $response = $this->post('/canvas/login', [
            'email' => 'not-an-email',
            'password' => 'password',
        ])->assertRedirect(route('canvas.login'));
        dd($response->exception);
        $this->assertSame('The given data was invalid.', $response->exception->getMessage());
    }

    public function testLoginRequestWillValidateAnEmailNotInTheDatabase(): void
    {
        $response = $this->post('/canvas/login', [
            'email' => 'email@example.com',
            'password' => 'password',
        ]);
//        ])->assertRedirect(route('canvas.login'));
        dd($response->exception);
        $this->assertSame('The given data was invalid.', $response->exception->getMessage());
    }

    public function testSuccessfulLogin(): void
    {
        $user = factory(User::class)->create([
            'password' => Hash::make('password'),
        ]);

        $this->post('/canvas/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(config('canvas.path'));
    }

    public function testSuccessfulLogout(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->get(route('canvas.logout'))
             ->assertRedirect(route('canvas.login'));
    }
}
