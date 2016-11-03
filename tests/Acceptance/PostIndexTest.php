<?php

class PostIndexTest extends TestCase
{
    use InteractsWithDatabase;

    /**
     * The user model.
     *
     * @var App\Models\User
     */
    private $user;

    /**
     * Create the user model test subject.
     *
     * @before
     * @return void
     */
    public function createUser()
    {
        $this->user = factory(App\Models\User::class)->create();
    }

    /** @test */
    public function it_applies_a_draft_label_to_a_non_published_post()
    {
        $this->actingAs($this->user)
            ->visit('admin')
            ->type('example', 'title')
            ->type('foo', 'slug')
            ->type('bar', 'subtitle')
            ->type('FooBar', 'content')
            ->type('example', 'title')
            ->type(Carbon\Carbon::now(), 'published_at')
            ->type(config('blog.post_layout'), 'layout')
            ->check('is_draft')
            ->press('Save');
        $this->assertSessionMissing('errors');
        $this->visit('admin/post')
            ->see('<td>&lt;span class="label label-primary"&gt;Draft&lt;/span&gt;</td>');
    }
}
