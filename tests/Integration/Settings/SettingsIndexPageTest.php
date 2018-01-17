<?php

namespace Tests;

use Auth;
use Illuminate\Foundation\Testing\DatabaseMigrations;

class SettingsIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    protected $optionalFields = [
        'blog_description' => '<dt>Description</dt>',
        'blog_seo' => '<dt>Blog SEO</dt>',
        'blog_author' => '<dt>Blog Author</dt>',
        'disqus_name' => '<dt>Disqus</dt>',
        'ga_id' => '<dt>Google Analytics</dt>',
    ];

    protected $requiredFields = [
        'blog_title',
        'blog_subtitle',
    ];

    /** @test */
    public function it_shows_error_messages_for_required_fields()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.settings'));

        // Fill in all of the required fields with an empty string
        foreach ($this->requiredFields as $name) {
            $this->type('', $name);
        }

        $this->press('Save');

        // Assert the response contains an error message for each field
        foreach ($this->requiredFields as $name) {
            $this->see('The '.str_replace('_', ' ', $name).' field is required.');
        }
    }

    /** @test */
    public function it_can_update_the_settings()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)->visit(route('canvas.admin.settings'));
        $this->type('New and Updated Title', 'blog_title')->press('Save');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.settings'));
    }

    /** @test */
    public function it_cannot_access_the_settings_page_if_user_is_not_an_admin()
    {
        Auth::guard('canvas')->login($this->user);
        $this->user['role'] = 0;
        $this->actingAs($this->user)->visit(route('canvas.admin.settings'));
        $this->seePageIs(route('canvas.admin'));
        $this->assertSessionMissing('errors');
    }
}
