<?php

namespace Tests;

use Auth;
use Canvas\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;

class ProfileIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    protected $optionalFields = [
        'bio' => 'Summary',
        'gender' => '<dt>Gender</dt>',
        'birthday' => '<dt>Birthday</dt>',
        'relationship' => '<dt>Relationship Status</dt>',
        'phone' => '<dt>Mobile Phone</dt>',
        'twitter' => '<dt>Twitter</dt>',
        'facebook' => '<dt>Facebook</dt>',
        'github' => '<dt>GitHub</dt>',
        'linkedin' => '<dt>LinkedIn</dt>',
        'resume_cv' => '<dt>Resume/CV</dt>',
        'url' => '<dt>Website</dt>',
        'address' => '<dt>Address</dt>',
        'city' => '<dt>City</dt>',
        'country' => '<dt>Country</dt>',
    ];

    protected $requiredFields = [
        'first_name',
        'last_name',
        'display_name',
        'email',
    ];

    /** @test */
    public function it_can_refresh_the_profile_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.profile.index'))
            ->click('Refresh Profile');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.profile.index'));
    }

    /** @test */
    public function it_shows_error_messages_for_required_fields()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs(factory(User::class)->create())
            ->visit(route('canvas.admin.profile.index'));

        // Fill in all of the required fields with an empty string
        foreach ($this->requiredFields as $name) {
            $this->type('', $name);
        }

        $this->press('Save');

        // Assert response contains an error message for each field
        foreach ($this->requiredFields as $name) {
            $this->see('The '.str_replace('_', ' ', $name).' field is required.');
        }
    }

    /** @test */
    public function it_can_update_the_authenticated_users_profile()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)->visit(route('canvas.admin.profile.index'));
        $this->type('Luke Skywalker', 'display_name')->press('Save')->see('Success! Profile has been updated.');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.profile.index'));
    }
}
