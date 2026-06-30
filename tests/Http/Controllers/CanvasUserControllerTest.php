<?php

use Canvas\Http\Middleware\EagerLoadCanvasUser;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Policies\UserPolicy;
use Canvas\Tests\Models\BareUser;
use Canvas\Tests\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

function useBareUserModel(): void
{
    config()->set('canvas.user_model', BareUser::class);
    Gate::policy(BareUser::class, UserPolicy::class);
}

it('lists users from canvas_users when the host model lacks HasCanvasAccess', function (): void {
    useBareUserModel();

    $this->seedDefaultCanvasUsers();

    $bareAdmin = BareUser::query()->find($this->admin->id);

    $this->actingAs($bareAdmin, 'canvas')
        ->getJson('canvas/api/users')
        ->assertSuccessful()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [[
                'id',
                'name',
                'email',
                'avatar_url',
                'posts_count',
                'canvas',
            ]],
        ]);
});

it('shows a user from canvas_users when the host model lacks HasCanvasAccess', function (): void {
    useBareUserModel();

    $bareAdmin = BareUser::query()->find($this->admin->id);

    $this->actingAs($bareAdmin, 'canvas')
        ->getJson("canvas/api/users/{$this->contributor->id}")
        ->assertSuccessful()
        ->assertJsonPath('id', $this->contributor->id)
        ->assertJsonPath('canvas.role', 1);
});

it('lists user posts when the host model lacks HasCanvasAccess', function (): void {
    useBareUserModel();

    Post::factory()->create(['user_id' => $this->admin->id]);

    $bareAdmin = BareUser::query()->find($this->admin->id);

    $this->actingAs($bareAdmin, 'canvas')
        ->getJson("canvas/api/users/{$this->admin->id}/posts")
        ->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('searches users from canvas_users when the host model lacks HasCanvasAccess', function (): void {
    useBareUserModel();

    $bareAdmin = BareUser::query()->find($this->admin->id);

    $this->actingAs($bareAdmin, 'canvas')
        ->getJson('canvas/api/search?q='.$this->editor->username)
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $this->editor->id,
            'type' => 'User',
        ]);
});

it('grants canvas access when the host model lacks HasCanvasAccess', function (): void {
    useBareUserModel();

    $hostUser = User::factory()->create();
    $bareAdmin = BareUser::query()->find($this->admin->id);

    $this->actingAs($bareAdmin, 'canvas')
        ->postJson("canvas/api/users/{$hostUser->id}", [
            'role' => 1,
        ])
        ->assertCreated();
});

it('eager loads canvas user from canvas_users for models without HasCanvasAccess', function (): void {
    $bareUser = BareUser::query()->find($this->contributor->id);

    $middleware = new EagerLoadCanvasUser;
    $request = Request::create('/canvas/api/posts', 'GET');
    $request->setUserResolver(fn () => $bareUser);

    $middleware->handle($request, fn () => response('ok'));

    expect($bareUser->relationLoaded('canvasUser'))->toBeTrue();
    expect($bareUser->getRelation('canvasUser'))->toBeInstanceOf(CanvasUser::class);
});
