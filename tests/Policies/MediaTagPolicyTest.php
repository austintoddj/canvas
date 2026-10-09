<?php

use Canvas\Models\MediaTag;
use Canvas\Policies\MediaTagPolicy;
use Canvas\Tests\Models\BareUser;

beforeEach(function (): void {
    $this->policy = new MediaTagPolicy;
    $this->tag = MediaTag::factory()->create(['user_id' => $this->contributor->id]);
});

it('allows any canvas author to list and view tags', function (): void {
    expect($this->policy->viewAny($this->contributor))->toBeTrue()
        ->and($this->policy->viewAny($this->editor))->toBeTrue()
        ->and($this->policy->view($this->contributor, $this->tag))->toBeTrue()
        ->and($this->policy->view($this->admin, $this->tag))->toBeTrue();
});

it('allows any canvas author to create tags', function (): void {
    expect($this->policy->create($this->contributor))->toBeTrue()
        ->and($this->policy->create($this->editor))->toBeTrue()
        ->and($this->policy->create($this->admin))->toBeTrue();
});

it('allows editors and admins to rename and delete tags', function (): void {
    expect($this->policy->update($this->editor, $this->tag))->toBeTrue()
        ->and($this->policy->update($this->admin, $this->tag))->toBeTrue()
        ->and($this->policy->delete($this->editor, $this->tag))->toBeTrue()
        ->and($this->policy->delete($this->admin, $this->tag))->toBeTrue();
});

it('denies contributors from renaming or deleting tags', function (): void {
    expect($this->policy->update($this->contributor, $this->tag))->toBeFalse()
        ->and($this->policy->delete($this->contributor, $this->tag))->toBeFalse();
});

it('resolves roles from canvas_users for host models without HasCanvasAccess', function (): void {
    $bareContributor = BareUser::query()->find($this->contributor->id);
    $bareEditor = BareUser::query()->find($this->editor->id);

    expect($this->policy->create($bareContributor))->toBeTrue()
        ->and($this->policy->update($bareContributor, $this->tag))->toBeFalse()
        ->and($this->policy->update($bareEditor, $this->tag))->toBeTrue();
});
