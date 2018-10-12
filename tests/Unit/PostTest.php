<?php

namespace Canvas\Tests\Unit;

use Canvas\Entities\Post;
use Canvas\Tests\TestCase;

class PostTest extends TestCase
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
        $post_by_id = app(Post::class)->find($this->testPost->id);
        $this->assertEquals($this->testPost->id, $post_by_id->id);
    }
}
