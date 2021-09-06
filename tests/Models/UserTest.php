<?php

namespace Canvas\Tests\Models;

use Canvas\Canvas;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

/**
 * Class UserTest.
 *
 * @covers \Canvas\Models\User
 */
class UserTest extends TestCase
{
    use RefreshDatabase;

    public function testDigestIsCastToBoolean(): void
    {
        $this->assertIsBool(factory(User::class)->create()->digest);
    }

    public function testDarkModeIsCastToBoolean(): void
    {
        $this->assertIsBool(factory(User::class)->create()->dark_mode);
    }

    public function testRoleIsCastToInteger(): void
    {
        $this->assertIsInt(factory(User::class)->create()->role);
    }

    public function testDefaultAvatarAppendsToTheModel(): void
    {
        $this->assertArrayHasKey('default_avatar', factory(User::class)->create()->toArray());
    }

    public function testDefaultLocaleAppendsToTheModel(): void
    {
        $this->assertArrayHasKey('default_locale', factory(User::class)->create()->toArray());
    }

    public function testPasswordIsHiddenForArrays(): void
    {
        $this->assertArrayNotHasKey('password', factory(User::class)->create()->toArray());
    }

    public function testRememberTokenIsHiddenForArrays(): void
    {
        $this->assertArrayNotHasKey('remember_token', factory(User::class)->create([
            'remember_token' => Str::random(60),
        ])->toArray());
    }

    public function testPostsRelationship(): void
    {
        factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $this->admin->posts());
        $this->assertInstanceOf(Post::class, $this->admin->posts->first());
    }

    public function testTagsRelationship(): void
    {
        factory(Tag::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $this->admin->tags());
        $this->assertInstanceOf(Tag::class, $this->admin->tags->first());
    }

    public function testTopicsRelationship(): void
    {
        factory(Topic::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $this->admin->topics());
        $this->assertInstanceOf(Topic::class, $this->admin->topics->first());
    }

    public function testContributorAttribute(): void
    {
        $user = factory(User::class)->create([
            'role' => null,
        ]);

        $this->assertTrue($user->isContributor);
        $this->assertTrue($this->contributor->isContributor);
    }

    public function testEditorAttribute(): void
    {
        $this->assertTrue($this->editor->isEditor);
    }

    public function testAdminAttribute(): void
    {
        $this->assertTrue($this->admin->isAdmin);
    }

    public function testDefaultAvatarAttribute(): void
    {
        $user = factory(User::class)->create([
            'avatar' => null,
        ]);

        $this->assertSame($user->defaultAvatar, Canvas::gravatar($user->email));
    }

    public function testDefaultLocaleAttribute(): void
    {
        $user = factory(User::class)->create([
            'locale' => null,
        ]);

        $this->assertSame($user->defaultLocale, config('app.locale'));
    }
}
