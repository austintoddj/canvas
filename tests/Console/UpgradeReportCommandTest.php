<?php

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Tests\Models\User;

it('prints a read-only upgrade report for a healthy v7 schema', function (): void {
    $this->seedDefaultCanvasUsers();

    $this->artisan('canvas:upgrade-report')
        ->assertSuccessful()
        ->expectsOutputToContain('Canvas upgrade report')
        ->expectsOutputToContain('v7-style canvas_users')
        ->expectsOutputToContain('Orphan / pivot counts')
        ->expectsOutputToContain('canvas:list-users');
});

it('reports zero content orphans when foreign keys are healthy', function (): void {
    $host = User::factory()->create();

    Post::factory()->create([
        'user_id' => $host->id,
        'published_at' => now()->subDay(),
    ]);

    $this->artisan('canvas:upgrade-report')
        ->assertSuccessful()
        ->expectsOutputToContain('canvas_posts.user_id orphans')
        ->expectsOutputToContain('canvas_users without host user');
});

it('flags digest users missing timezone', function (): void {
    $user = User::factory()->create();

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Contributor,
        'digest' => true,
        'timezone' => null,
    ]);

    $this->artisan('canvas:upgrade-report')
        ->assertSuccessful()
        ->expectsOutputToContain('digest + null timezone');
});

it('points operators at UPGRADE playbooks', function (): void {
    $this->artisan('canvas:upgrade-report')
        ->assertSuccessful()
        ->expectsOutputToContain('UPGRADE.md')
        ->expectsOutputToContain('resources/upgrade/');
});
