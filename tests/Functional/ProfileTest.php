<?php

use Illuminate\Foundation\Testing\DatabaseMigrations;

class ProfileTest extends TestCase
{
    use DatabaseMigrations;

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
        'address' => '<dt>Address</dt>',
        'city' => '<dt>City</dt>',
        'country' => '<dt>Country</dt>',
    ];

    protected $requiredFields = [
        'first_name',
        'last_name',
        'display_name',
        'email',
        'job',
        'city',
        'country',
    ];

    public function testItDoesntHidesOptionalFieldsIfEmpty()
    {
        // first make sure we can see all the elements
        $user = factory(App\Models\User::class)->create();
        $this->actingAs($user)->visit('/admin/profile');
        array_map([$this, 'see'], $this->optionalFields);

        // now set them all null and make sure we do not see them
        $user->update(array_fill_keys(array_keys($this->optionalFields), null));
        $this->actingAs($user)->visit('/admin/profile');
        array_map([$this, 'dontSee'], $this->optionalFields);
    }

    public function testItShowsErrorMessagesForRequiredFields()
    {
        $this->actingAs(factory(App\Models\User::class)->create())
            ->visit('/admin/profile/1/edit');

        // fill in all require fields with an empty string
        foreach ($this->requiredFields as $name) {
            $this->type('', $name);
        }

        $this->press('Save');

        // assert response contains error message for each field
        foreach ($this->requiredFields as $name) {
            $this->see('The '.str_replace('_', ' ', $name).' field is required.');
        }
    }
}
