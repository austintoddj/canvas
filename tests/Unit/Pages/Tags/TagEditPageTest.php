<?php

namespace Tests\Unit\Pages\Tag;

use Tests\TestCase;
use Tests\TestHelper;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Canvas\Helpers\CanvasHelper;
use Tests\InteractsWithDatabase;

class TagEditPageTest extends TestCase
{
    use InteractsWithDatabase, CreatesUser, TestHelper;

    /**
     * Get the successful delete message for a tag.
     *
     * @return string
     */
    protected function getDeleteMessage()
    {
        return trans('canvas::messages.delete_success', ['entity' => 'tag']);
    }

    /** @test */
    public function it_can_edit_tags()
    {
        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.tag.edit', 1)
            ->type('Foo', 'title')
            ->press('Save')

            // Assertions
            ->assertResponseStatus(Response::HTTP_OK)
            ->seeInDatabase(CanvasHelper::TABLES['tags'], ['title' => 'Foo'])
            ->see('Foo')
            ->seePageIs(route('canvas.admin.tag.edit', 1))
            ->assertSessionMissing('errors');
    }

    /** @test */
    public function it_can_delete_a_tag_from_the_database()
    {
        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.tag.edit', 1);
        $this->press('Delete Tag');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->see(self::getDeleteMessage())
            ->dontSeeInDatabase(CanvasHelper::TABLES['tags'], ['id' => 1])
            ->assertSessionMissing('errors');
    }
}
