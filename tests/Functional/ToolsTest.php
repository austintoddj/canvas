<?php

class ToolsTest extends TestCase
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
    public function it_can_clear_the_application_cache()
    {
        $this->actingAs($this->user)
            ->visit('/admin/tools')
            ->click('Clear Cache');
        $this->assertSessionMissing('errors');
        $this->seePageIs('/admin/tools');
    }
}
