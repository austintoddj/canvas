<?php

namespace Canvas\Tests\Unit;

use Canvas\Entities\Tag;
use Canvas\Tests\TestCase;

class TagTest extends TestCase
{
    /**
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
    }

    /** @test */
    public function it_is_retrievable_by_id()
    {
        $tag_by_id = app(Tag::class)->find($this->testTag->id);
        $this->assertEquals($this->testTag->id, $tag_by_id->id);
    }
}
