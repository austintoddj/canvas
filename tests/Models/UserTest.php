<?php

namespace Canvas\Tests\Models;

use Canvas\Helpers\URL;
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

    /** @test */
    public function digest_is_cast_to_a_boolean()
    {
        $this->assertIsBool(factory(User::class)->create()->digest);
    }

    /** @test */
    public function dark_mode_is_cast_to_a_boolean()
    {
        $this->assertIsBool(factory(User::class)->create()->dark_mode);
    }

    /** @test */
    public function role_is_cast_to_an_integer()
    {
        $this->assertIsInt(factory(User::class)->create()->role);
    }

    /** @test */
    public function default_avatar_appends_to_the_model()
    {
        $this->assertArrayHasKey('default_avatar', factory(User::class)->create()->toArray());
    }

    /** @test */
    public function default_locale_appends_to_the_model()
    {
        $this->assertArrayHasKey('default_locale', factory(User::class)->create()->toArray());
    }

    /** @test */
    public function password_is_hidden_for_arrays()
    {
        $this->assertArrayNotHasKey('password', factory(User::class)->create()->toArray());
    }

    /** @test */
    public function remember_token_is_hidden_for_arrays()
    {
        $this->assertArrayNotHasKey('remember_token', factory(User::class)->create([
            'remember_token' => Str::random(60),
        ])->toArray());
    }

    /** @test */
    public function posts_relationship()
    {
        $user = factory(User::class)->create();

        factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $user->posts());
        $this->assertInstanceOf(Post::class, $user->posts->first());
    }

    /** @test */
    public function tags_relationship()
    {
        $user = factory(User::class)->create();

        factory(Tag::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $user->tags());
        $this->assertInstanceOf(Tag::class, $user->tags->first());
    }

    /** @test */
    public function topics_relationship()
    {
        $user = factory(User::class)->create();

        factory(Topic::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $user->topics());
        $this->assertInstanceOf(Topic::class, $user->topics->first());
    }

    /** @test */
    public function contributor_attribute()
    {
        $this->assertTrue(factory(User::class)->create([
            'role' => User::CONTRIBUTOR,
        ])->isContributor);
    }

    /** @test */
    public function editor_attribute()
    {
        $this->assertTrue(factory(User::class)->create([
            'role' => User::EDITOR,
        ])->isEditor);
    }

    /** @test */
    public function admin_attribute()
    {
        $this->assertTrue(factory(User::class)->create([
            'role' => User::ADMIN,
        ])->isAdmin);
    }

    /** @test */
    public function default_avatar_attribute()
    {
        $user = factory(User::class)->create([
            'avatar' => null,
        ]);

        $this->assertSame($user->defaultAvatar, URL::gravatar($user->email));
    }

    /** @test */
    public function default_locale_attribute()
    {
        $user = factory(User::class)->create([
            'locale' => null,
        ]);

        $this->assertSame($user->defaultLocale, config('app.locale'));
    }
}
