<?php

namespace Tests;

use Auth;
use Canvas\Helpers\CanvasHelper;

class UserCreatePageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_press_cancel_to_return_to_the_user_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.create'))
            ->click('Cancel');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.user.index'));
    }

    /** @test */
    public function it_validates_the_user_create_form()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)->post(route('canvas.admin.user.store'), ['first_name' => 'foo']);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.create'))
            ->type('will', 'first_name')
            ->type('notValidate', 'last_name')
            ->press('Save');
        $this->seePageIs(route('canvas.admin.user.create'));
        $this->dontSeeInDatabase(CanvasHelper::TABLES['users'], ['first_name' => 'will', 'last_name' => 'notValidate']);
    }

    /** @test */
    public function it_can_create_a_user_and_save_it_to_the_database()
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
