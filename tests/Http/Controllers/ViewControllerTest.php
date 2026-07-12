<?php

use Canvas\Support\FrontendBootData;

it('returns script variables', function (): void {
    setUnsplashAccessKey('test-access-key');

    $response = $this->actingAs($this->admin, 'canvas')
        ->get(config('canvas.path'))
        ->assertSuccessful()
        ->assertViewIs('canvas::layout')
        ->assertViewHas('jsVars');

    $this->assertSame(FrontendBootData::forUser($this->admin), $response->viewData('jsVars'));
    $response->assertSee('canvas');
    expect($response->viewData('jsVars')['unsplash'])->toBeTrue();
});
