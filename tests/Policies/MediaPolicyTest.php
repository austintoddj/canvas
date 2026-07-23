<?php

use Canvas\Models\Media;
use Canvas\Policies\MediaPolicy;
use Canvas\Tests\Models\BareUser;

beforeEach(function (): void {
    $this->policy = new MediaPolicy;
});

it('allows editors and admins to view all media', function (): void {
    expect($this->policy->viewAll($this->editor))->toBeTrue()
        ->and($this->policy->viewAll($this->admin))->toBeTrue();
});

it('denies contributors from viewing all media', function (): void {
    expect($this->policy->viewAll($this->contributor))->toBeFalse();
});

it('allows editors and admins to view any media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->view($this->editor, $media))->toBeTrue()
        ->and($this->policy->view($this->admin, $media))->toBeTrue();
});

it('allows contributors to view their own media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->view($this->contributor, $media))->toBeTrue();
});

it('denies contributors from viewing other users media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->view($this->contributor, $media))->toBeFalse();
});

it('allows editors and admins to update any media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->update($this->editor, $media))->toBeTrue()
        ->and($this->policy->update($this->admin, $media))->toBeTrue();
});

it('allows contributors to update their own media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->update($this->contributor, $media))->toBeTrue();
});

it('denies contributors from updating other users media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->update($this->contributor, $media))->toBeFalse();
});

it('allows editors and admins to delete any media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->delete($this->editor, $media))->toBeTrue()
        ->and($this->policy->delete($this->admin, $media))->toBeTrue();
});

it('allows contributors to delete their own media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    expect($this->policy->delete($this->contributor, $media))->toBeTrue();
});

it('denies contributors from deleting other users media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->delete($this->contributor, $media))->toBeFalse();
});

it('resolves roles from canvas_users for host models without HasCanvasAccess', function (): void {
    $bareContributor = BareUser::query()->find($this->contributor->id);
    $bareEditor = BareUser::query()->find($this->editor->id);
    $ownMedia = Media::factory()->create(['user_id' => $this->contributor->id]);
    $otherMedia = Media::factory()->create(['user_id' => $this->editor->id]);

    expect($this->policy->viewAll($bareContributor))->toBeFalse()
        ->and($this->policy->viewAll($bareEditor))->toBeTrue()
        ->and($this->policy->view($bareContributor, $ownMedia))->toBeTrue()
        ->and($this->policy->view($bareContributor, $otherMedia))->toBeFalse()
        ->and($this->policy->view($bareEditor, $otherMedia))->toBeTrue();
});
