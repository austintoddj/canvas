<?php

namespace Canvas\Tests\Http\Requests;

use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class StoreUserRequestTest.
 *
 * @covers \Canvas\Http\Requests\StoreUserRequest
 */
class StoreUserRequestTest extends TestCase
{
    use RefreshDatabase;

    public function testAdminRoleOrUpdatingSelfIsRequired(): void
    {
        $user = User::factory()->create();

        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $contributor = User::factory()->contributor()->create();

        $this->actingAs($contributor, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $user->id]), [
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->assertForbidden();

        $this->actingAs($contributor, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $contributor->id]), [
                'name' => $contributor->name,
                'email' => $contributor->email,
            ])
            ->assertSuccessful();

        $this->actingAs($editor, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $user->id]), [
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->assertForbidden();

        $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $user->id]), [
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->assertSuccessful();
    }

    public function testNameIsRequired(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'email' => $admin->email,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'name',
                ],
            ]);

        $this->assertSame(trans('canvas::app.name_required'), $response->getOriginalContent()['message']);
    }

    public function testEmailIsRequired(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'name' => $admin->name,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'email',
                ],
            ]);

        $this->assertSame(trans('canvas::app.email_required'), $response->getOriginalContent()['message']);
    }

    public function testDuplicateEmailsAreValidated(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'name' => $admin->name,
                'email' => $editor->email,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'email',
                ],
            ]);

        $this->assertSame(trans('canvas::app.email_unique'), $response->getOriginalContent()['message']);
    }

    public function testInvalidEmailsAreValidated(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'name' => $admin->name,
                'email' => 'not-an-email',
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'email',
                ],
            ]);

        $this->assertSame(trans('canvas::app.email_email'), $response->getOriginalContent()['message']);
    }

    public function testDuplicateUsernamesAreValidated(): void
    {
        $admin = User::factory()->admin()->create();

        $editor = User::factory()->editor()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'name' => $admin->name,
                'email' => $admin->email,
                'username' => $editor->username,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'username',
                ],
            ]);

        $this->assertSame(trans('canvas::app.username_unique'), $response->getOriginalContent()['message']);
    }

    public function testInvalidPasswordCombinationsAreValidated(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'name' => $admin->name,
                'email' => $admin->email,
                'password' => 'password',
                'password_confirmation' => 'not-a-match',
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'password',
                ],
            ]);

        $this->assertSame(trans('canvas::app.password_confirmed'), $response->getOriginalContent()['message']);
    }

    public function testShortPasswordsAreValidated(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.users.store', ['id' => $admin->id]), [
                'name' => $admin->name,
                'email' => $admin->email,
                'password' => 'pass',
                'password_confirmation' => 'pass',
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'password',
                ],
            ]);

        $this->assertSame(trans('canvas::app.password_min'), $response->getOriginalContent()['message']);
    }
}
