<?php

namespace Tests\Unit\Pages\Profile;

use Tests\TestCase;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;

class ProfileIndexPageTest extends TestCase
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
        // Actions
        $this->createUser()->actingAs($this->user)
            ->visit(route('canvas.admin.profile.index'))
            ->click('Refresh Profile');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.profile.index'))
            ->see(e('Profile'));
        $this->assertSessionMissing('errors');
    }

    /** @test */
    public function it_shows_error_messages_for_required_fields()
    {
        // Actions
        $this->createUser()->actingAs($this->user)
            ->visit(route('canvas.admin.profile.index'));
        foreach ($this->requiredFields as $name) {
            $this->type('', $name);
        }
        $this->press('Save');

        // Assertions
        foreach ($this->requiredFields as $name) {
            $this->see('The '.str_replace('_', ' ', $name).' field is required.');
        }
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.profile.index'))
            ->see(e('Profile'));
    }

    /** @test */
    public function it_can_update_the_authenticated_users_profile()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->visit(route('canvas.admin.profile.index'))
            ->type('New Name', 'display_name')
            ->press('Save');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.profile.index'))
            ->see(trans('canvas::messages.update_success', ['entity' => 'profile']));
        $this->assertSessionMissing('errors');
    }
}
