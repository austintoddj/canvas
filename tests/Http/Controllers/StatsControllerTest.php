<?php

use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;

it('fetches user stats by default', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->admin->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(2)->make()->toArray());
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    });

    Post::factory()->count(2)->create([
        'user_id' => $this->contributor->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(1)->make()->toArray());
        $post->views()->createMany(View::factory()->count(2)->make()->toArray());
    });

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats')
        ->assertSuccessful()
        ->assertJsonStructure([
            'views',
            'visits',
            'graph' => [
                'views',
                'visits',
            ],
        ])
        ->assertJsonFragment([
            'views' => 9,
            'visits' => 6,
        ]);
});
it('fetches all post stats with a given query scope', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->admin->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(2)->make()->toArray());
        $post->views()->createMany(View::factory()->count(3)->make()->toArray());
    });

    Post::factory()->count(2)->create([
        'user_id' => $this->contributor->id,
    ])->each(function ($post) {
        $post->visits()->createMany(Visit::factory()->count(1)->make()->toArray());
        $post->views()->createMany(View::factory()->count(2)->make()->toArray());
    });

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/stats?scope=all')
        ->assertSuccessful()
        ->assertJsonStructure([
            'views',
            'visits',
            'graph' => [
                'views',
                'visits',
            ],
        ])
        ->assertJsonFragment([
            'views' => 13,
            'visits' => 8,
        ]);
});
