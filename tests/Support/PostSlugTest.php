<?php

use Canvas\Models\Post;
use Canvas\Support\PostSlug;

it('slugifies titles the way the editor does', function (): void {
    expect(PostSlug::slugify('Hello, Canvas!'))->toBe('hello-canvas')
        ->and(PostSlug::slugify('   '))->toBe('post')
        ->and(PostSlug::slugify('🔫'))->toBe('post')
        ->and(PostSlug::disambiguate(null, null, '', 'Hello World'))->toBe('');
});

it('does not treat a hand-typed suffix as the next auto slot', function (): void {
    expect(PostSlug::isAutoSuffix('hello-world-2', 'hello-world'))->toBeTrue()
        ->and(PostSlug::isAutoSuffix('hello-world-10', 'hello-world'))->toBeTrue()
        ->and(PostSlug::isAutoSuffix('hello-world-1', 'hello-world'))->toBeFalse()
        ->and(PostSlug::isGenerated('post-1e5b87d6-1dda-4c95-9449-94970542076d'))->toBeTrue()
        ->and(PostSlug::isGenerated('hello-world'))->toBeFalse();
});

it('returns the colliding title slug when every suffix through the cap is taken', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
    ]);

    for ($n = 2; $n <= PostSlug::MAX_SUFFIX; $n++) {
        Post::factory()->create([
            'user_id' => $this->admin->id,
            'slug' => 'hello-world-'.$n,
        ]);
    }

    expect(PostSlug::disambiguate(null, null, 'hello-world', 'Hello World'))->toBe('hello-world');
})->group('database');

it('ignores a non-numeric owner when releasing a trashed slug', function (): void {
    $trashed = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'kept-slug',
    ]);
    $trashed->delete();

    PostSlug::releaseTrashedForUser('', $this->admin->id);
    PostSlug::releaseTrashedForUser('kept-slug', 'not-a-user');

    expect(Post::onlyTrashed()->find($trashed->id)?->slug)->toBe('kept-slug');
})->group('database');
