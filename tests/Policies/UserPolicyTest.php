<?php

use Canvas\Policies\UserPolicy;
use Canvas\Tests\Models\BareUser;

beforeEach(function (): void {
    $this->policy = new UserPolicy;
});

it('allows only admins to create users', function (): void {
    expect($this->policy->create($this->admin))->toBeTrue()
        ->and($this->policy->create($this->editor))->toBeFalse()
        ->and($this->policy->create($this->contributor))->toBeFalse();
});

it('allows admins to update any user', function (): void {
    expect($this->policy->update($this->admin, $this->contributor))->toBeTrue()
        ->and($this->policy->update($this->admin, $this->editor))->toBeTrue();
});

it('allows users to update themselves', function (): void {
    expect($this->policy->update($this->contributor, $this->contributor))->toBeTrue()
        ->and($this->policy->update($this->editor, $this->editor))->toBeTrue()
        ->and($this->policy->update($this->admin, $this->admin))->toBeTrue();
});

it('denies non-admins from updating other users', function (): void {
    expect($this->policy->update($this->contributor, $this->editor))->toBeFalse()
        ->and($this->policy->update($this->editor, $this->contributor))->toBeFalse();
});

it('allows admins to delete other users', function (): void {
    expect($this->policy->delete($this->admin, $this->contributor))->toBeTrue()
        ->and($this->policy->delete($this->admin, $this->editor))->toBeTrue();
});

// Regression: GH-779 — users cannot revoke their own canvas access via delete
it('prevents users from deleting themselves', function (): void {
    expect($this->policy->delete($this->admin, $this->admin))->toBeFalse()
        ->and($this->policy->delete($this->contributor, $this->contributor))->toBeFalse()
        ->and($this->policy->delete($this->editor, $this->editor))->toBeFalse();
});

it('denies non-admins from deleting other users', function (): void {
    expect($this->policy->delete($this->editor, $this->contributor))->toBeFalse()
        ->and($this->policy->delete($this->contributor, $this->editor))->toBeFalse();
});

it('resolves roles from canvas_users for host models without HasCanvasAccess', function (): void {
    $bareAdmin = BareUser::query()->find($this->admin->id);
    $bareContributor = BareUser::query()->find($this->contributor->id);
    $bareEditor = BareUser::query()->find($this->editor->id);

    expect($this->policy->create($bareAdmin))->toBeTrue()
        ->and($this->policy->create($bareContributor))->toBeFalse()
        ->and($this->policy->update($bareContributor, $bareContributor))->toBeTrue()
        ->and($this->policy->update($bareContributor, $bareEditor))->toBeFalse()
        ->and($this->policy->delete($bareAdmin, $bareContributor))->toBeTrue()
        ->and($this->policy->delete($bareAdmin, $bareAdmin))->toBeFalse();
});
