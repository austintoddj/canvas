<?php

use Canvas\Canvas;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

it('digest is cast to boolean', function (): void {
    $this->assertIsBool(User::factory()->create()->digest);
});
it('dark mode is cast to boolean', function (): void {
    $this->assertIsBool(User::factory()->create()->dark_mode);
});
it('role is cast to integer', function (): void {
    $this->assertIsInt(User::factory()->create()->role);
});
it('default avatar appends to the model', function (): void {
    $this->assertArrayHasKey('default_avatar', User::factory()->create()->toArray());
});
it('default locale appends to the model', function (): void {
    $this->assertArrayHasKey('default_locale', User::factory()->create()->toArray());
});
it('password is hidden for arrays', function (): void {
    $this->assertArrayNotHasKey('password', User::factory()->create()->toArray());
});
it('remember token is hidden for arrays', function (): void {
    $this->assertArrayNotHasKey('remember_token', User::factory()->create([
        'remember_token' => Str::random(60),
    ])->toArray());
});
it('posts relationship', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $this->admin->posts());
    $this->assertInstanceOf(Post::class, $this->admin->posts->first());
});
it('tags relationship', function (): void {
    Tag::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $this->admin->tags());
    $this->assertInstanceOf(Tag::class, $this->admin->tags->first());
});
it('topics relationship', function (): void {
    Topic::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    $this->assertInstanceOf(HasMany::class, $this->admin->topics());
    $this->assertInstanceOf(Topic::class, $this->admin->topics->first());
});
it('contributor attribute', function (): void {
    $this->assertTrue($this->contributor->isContributor);
});
it('editor attribute', function (): void {
    $this->assertTrue($this->editor->isEditor);
});
it('admin attribute', function (): void {
    $this->assertTrue($this->admin->isAdmin);
});
it('default avatar attribute', function (): void {
    $user = User::factory()->create([
        'avatar' => null,
    ]);

    $this->assertSame($user->defaultAvatar, Canvas::gravatar($user->email));
});
it('default locale attribute', function (): void {
    $user = User::factory()->create([
        'locale' => null,
    ]);

    $this->assertSame($user->defaultLocale, config('app.locale'));
});
