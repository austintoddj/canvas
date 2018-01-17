<?php

namespace Tests;

use Auth;
use Canvas\Helpers\CanvasHelper;

class UserEditPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_edit_a_users_details()
    {
        $this->it_can_create_a_user_and_save_it_to_the_database();

        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.edit', 2))
            ->type('New Name', 'first_name')
            ->press('Save')
            ->seePageIs(route('canvas.admin.user.edit', 2))
            ->see('Success! User has been updated.')
            ->seeInDatabase(CanvasHelper::TABLES['users'], ['first_name' => 'New Name']);
    }

    /** @test */
    public function it_can_delete_a_user_from_the_database()
    {
        $this->it_can_create_a_user_and_save_it_to_the_database();

        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.edit', 4))
            ->press('Delete')
            ->dontSee('Success! User has been deleted.')
            ->press('Delete User')
            ->see('Success! User has been deleted.')
            ->dontSeeInDatabase(CanvasHelper::TABLES['users'], ['first_name' => 'first']);
    }

    /** @test */
    public function it_validates_the_user_password_update_form()
    {
        $this->it_can_create_a_user_and_save_it_to_the_database();

        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.privacy', 2))
            ->type('secretpassword', 'new_password')
            ->press('Save')
            ->seePageIs(route('canvas.admin.user.privacy', 2));
    }

    /** @test */
    public function it_can_update_a_users_password()
    {
        $this->it_can_create_a_user_and_save_it_to_the_database();

        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.privacy', 2))
            ->type('secretpassword', 'new_password')
            ->type('secretpassword', 'new_password_confirmation')
            ->press('Save')
            ->seePageIs(route('canvas.admin.user.edit', 2))
            ->see('Success! Password has been updated.');
    }

    protected function it_can_create_a_user_and_save_it_to_the_database()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.create'))
            ->type('first', 'first_name')
            ->type('last', 'last_name')
            ->type('display', 'display_name')
            ->type('email@example.com', 'email')
            ->type('password', 'password')
            ->select(1, 'role')
            ->press('Save');

        $this->seeInDatabase(CanvasHelper::TABLES['users'], [
            'id'            => 4,
            'first_name'    => 'first',
            'last_name'     => 'last',
            'display_name'  => 'display',
            'role'          => 1,
            'email'         => 'email@example.com',
        ]);

        $this->seePageIs(route('canvas.admin.user.index'));
        $this->see('Success! New user has been created.');
        $this->assertSessionMissing('errors');
    }
}
