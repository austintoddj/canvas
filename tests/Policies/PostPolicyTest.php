<?php

use Canvas\Models\Post;
use Canvas\Policies\PostPolicy;
use Canvas\Tests\Models\BareUser;

beforeEach(function (): void {
    $this->policy = new PostPolicy;
});

it('allows editors and admins to view all posts', function (): void {
    expect($this->policy->viewAll($this->editor))->toBeTrue()
        ->and($this->policy->viewAll($this->admin))->toBeTrue();
});

it('denies contributors from viewing all posts', function (): void {
    expect($this->policy->viewAll($this->contributor))->toBeFalse();
});

it('allows editors and admins to view any post', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->view($this->editor, $post))->toBeTrue()
        ->and($this->policy->view($this->admin, $post))->toBeTrue();
});

it('allows contributors to view their own posts', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->view($this->contributor, $post))->toBeTrue();
});

it('denies contributors from viewing other users posts', function (): void {
    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->view($this->contributor, $post))->toBeFalse();
});

it('allows editors and admins to update any post', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->update($this->editor, $post))->toBeTrue()
        ->and($this->policy->update($this->admin, $post))->toBeTrue();
});

it('allows contributors to update their own posts', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->update($this->contributor, $post))->toBeTrue();
});

it('denies contributors from updating other users posts', function (): void {
    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->update($this->contributor, $post))->toBeFalse();
});

it('allows editors and admins to delete any post', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->delete($this->editor, $post))->toBeTrue()
        ->and($this->policy->delete($this->admin, $post))->toBeTrue();
});

it('allows contributors to delete their own posts', function (): void {
    $post = Post::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->delete($this->contributor, $post))->toBeTrue();
});

it('denies contributors from deleting other users posts', function (): void {
    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->delete($this->contributor, $post))->toBeFalse();
});

it('resolves roles from canvas_users for host models without HasCanvasAccess', function (): void {
    $bareContributor = BareUser::query()->find($this->contributor->id);
    $bareEditor = BareUser::query()->find($this->editor->id);
    $ownPost = Post::factory()->create(['user_id' => $this->contributor->id]);
    $otherPost = Post::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->viewAll($bareContributor))->toBeFalse()
        ->and($this->policy->viewAll($bareEditor))->toBeTrue()
        ->and($this->policy->view($bareContributor, $ownPost))->toBeTrue()
        ->and($this->policy->view($bareContributor, $otherPost))->toBeFalse()
        ->and($this->policy->view($bareEditor, $otherPost))->toBeTrue();
});
