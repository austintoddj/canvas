<?php

namespace Canvas\Tests\Unit;

use Canvas\Entities\Tag;
use Canvas\Tests\TestCase;
use Faker\Factory as Faker;

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
    public function it_can_create_a_tag()
    {
        $tag = $this->createDefaultTag();

        $this->assertNotEmpty($tag->name);
        $this->assertNotEmpty($tag->slug);
    }

    /** @test */
    public function it_is_retrievable_by_id()
    {
        $tag = $this->createDefaultTag();
        $tag_by_id = app(Tag::class)->find($tag->id);

        $this->assertEquals($tag->id, $tag_by_id->id);
    }

    /**
     * @return Tag
     */
    private function createDefaultTag(): Tag
    {
        return Tag::create([
            'name' => Faker::create()->word,
            'slug' => Faker::create()->slug,
        ]);
    }
}
