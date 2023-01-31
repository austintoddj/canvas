<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Class TagControllerTest.
 *
 * @covers \Canvas\Http\Controllers\TagController
 * @covers \Canvas\Http\Requests\StoreTagRequest
 * @covers \Canvas\Http\Middleware\VerifyAdmin
 */
class TagControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testListAllTags(): void
    {
        $tag = Tag::factory(2)->create();

        $response = $this->actingAs($tag->first()->user, 'canvas')
                         ->getJson(route('canvas.tags.index'))
                         ->assertSuccessful();

        $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(2, $response->getOriginalContent());
    }

    public function testTagsCanBeSortedByCreationDateWithAGivenQueryParameter(): void
    {
        $tag = Tag::factory()->create(['created_at' => now()]);

        $oldTag = Tag::factory()->create(['created_at' => now()->subDay()]);

        $response = $this->actingAs($tag->user, 'canvas')
            ->getJson(route('canvas.tags.index', ['sort' => 'desc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $tag->id);

        $response = $this->actingAs($tag->user, 'canvas')
            ->getJson(route('canvas.tags.index', ['sort' => 'asc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $oldTag->id);

        $response = $this->actingAs($tag->user, 'canvas')
            ->getJson(route('canvas.tags.index'))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $tag->id);
    }

    public function testTagsCanBeFilteredByUsageWithAGivenQueryParameter(): void
    {
        $popularTag = Tag::factory()->has(Post::factory(2))->create();

        $unpopularTag = Tag::factory()->has(Post::factory())->create();

        $response = $this->actingAs($popularTag->user, 'canvas')
            ->getJson(route('canvas.tags.index', ['usage' => 'popular']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $popularTag->id);

        $response = $this->actingAs($popularTag->user, 'canvas')
            ->getJson(route('canvas.tags.index', ['usage' => 'unpopular']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $unpopularTag->id);
    }

    public function testExistingTagData(): void
    {
        $tag = Tag::factory()->create();

        $response = $this->actingAs($tag->user, 'canvas')
                         ->getJson(route('canvas.tags.show', ['tag' => $tag->id]))
                         ->assertSuccessful();

        $this->assertTrue($tag->is($response->getOriginalContent()));
    }

    public function testListPostsForTag(): void
    {
        $tag = Tag::factory()->has(Post::factory())->create();

        $response = $this->actingAs($tag->user, 'canvas')
                        ->getJson(route('canvas.tags.posts', ['tag' => $tag->id]))
                         ->assertSuccessful();

        $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(1, $response->getOriginalContent());
    }

    public function testTagNotFound(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
             ->getJson(route('canvas.tags.show', ['tag' => 'tag-not-found']))
             ->assertNotFound();
    }

    public function testStoreNewTag(): void
    {
        $user = User::factory()->admin()->create();

        $data = [
            'name' => 'A new tag',
            'slug' => 'a-new-tag',
            'user_id' => $user->id,
        ];

        $response = $this->actingAs($user, 'canvas')
                         ->postJson(route('canvas.tags.store', $data))
                         ->assertSuccessful();

        $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

        $this->assertSame($data['slug'], $response->getOriginalContent()->slug);
    }

    public function testDeletedTagsCanBeRefreshed(): void
    {
        $deletedTag = Tag::factory()->create(['deleted_at' => now()]);

        $data = [
            'name' => $deletedTag->name,
            'slug' => $deletedTag->slug,
            'user_id' => $deletedTag->user_id,
        ];

        $response = $this->actingAs($deletedTag->user, 'canvas')
                         ->putJson(route('canvas.tags.update', ['tag' => $deletedTag->id]), $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

        $this->assertNotSoftDeleted('canvas_tags', [
            'id' => $deletedTag->id,
            'slug' => $deletedTag->slug,
        ]);
    }

    public function testUpdateExistingTag(): void
    {
        $tag = Tag::factory()->create();

        $data = [
            'name' => 'An updated tag',
            'slug' => 'an-updated-tag',
            'user_id' => $tag->user_id,
        ];

        $response = $this->actingAs($tag->user, 'canvas')
                            ->putJson(route('canvas.tags.update', ['tag' => $tag->id]), $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

        $this->assertSame($data['slug'], $response->getOriginalContent()->slug);
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $this->actingAs($user = User::factory()->admin()->create(), 'canvas')
             ->postJson(route('canvas.tags.store'), [
                 'name' => 'A new tag',
                 'slug' => 'a new.slug',
                 'user_id' => $user->id,
             ])
             ->assertStatus(422)
             ->assertJsonStructure([
                 'errors' => [
                     'slug',
                 ],
             ]);
    }

    public function testDeleteExistingTag(): void
    {
        $tag = Tag::factory()->create();

        $this->actingAs($tag->user, 'canvas')
             ->deleteJson(route('canvas.tags.destroy', ['tag' => 'not-a-tag']))
             ->assertNotFound();

        $this->actingAs($tag->user, 'canvas')
            ->deleteJson(route('canvas.tags.destroy', ['tag' => $tag->id]))
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_tags', [
            'id' => $tag->id,
            'slug' => $tag->slug,
        ]);
    }
}
