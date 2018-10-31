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

    /** @test **/
    public function it_can_generate_its_own_reliable_slug()
    {
        $name = 'My Tag';
        $expectedSlug = str_slug($name);
        $tagData = ['name' => $name];
        $tag1 = Tag::create($tagData);
        $tag2 = Tag::create($tagData);
        $tag3 = Tag::create($tagData);

        $this->assertSame($expectedSlug, $tag1->slug);
        $this->assertSame("$expectedSlug-1", $tag2->slug);
        $this->assertSame("$expectedSlug-2", $tag3->slug);
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
