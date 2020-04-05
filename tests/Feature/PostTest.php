<?php

namespace Canvas\Tests\Feature;

use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class PostTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function store_a_post()
    {
        $user = factory(config('canvas.user'))->create();
        $response = $this->actingAs($user)->withoutMiddleware()->post('canvas/api/posts', [
            'id' => Uuid::uuid4(),
            'slug' => 'a-new-hope',
        ]);
    }
}
