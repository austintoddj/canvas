<?php

namespace Canvas\Tests\Models;

use Canvas\Models\Post;
use Canvas\Models\Visit;
use Canvas\Tests\TestCase;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class VisitTest.
 *
 * @covers \Canvas\Models\Visit
 */
class VisitTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function post_relationship()
    {
        $post = factory(Post::class)->create();

        $visit = factory(Visit::class)->create([
            'post_id' => $post->id,
        ]);

        $post->visits()->saveMany([$visit]);

        $this->assertInstanceOf(BelongsTo::class, $visit->post());
        $this->assertInstanceOf(Post::class, $visit->post()->first());
    }
}
