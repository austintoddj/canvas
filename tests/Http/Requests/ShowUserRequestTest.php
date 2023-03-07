<?php

namespace Canvas\Tests\Http\Requests;

use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class ShowUserRequestTest.
 *
 * @covers \Canvas\Http\Requests\ShowUserRequest
 */
class ShowUserRequestTest extends TestCase
{
    use RefreshDatabase;

    public function testAdminRoleOrShowingSelfIsRequired(): void
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
}
