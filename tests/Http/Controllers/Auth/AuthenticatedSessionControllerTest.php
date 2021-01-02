<?php

namespace Canvas\Tests\Http\Controllers\Auth;

use App\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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

        $this->assertInstanceOf(ValidationException::class, $response->exception);
    }

    public function testLoginRequestWillValidateAnUnknownPassword(): void
    {
        $response = $this->post('/canvas/login', [
            'email' => $this->admin->email,
            'password' => 'what-is-my-password',
        ])->assertSessionHasErrors();

        $this->assertInstanceOf(ValidationException::class, $response->exception);
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
