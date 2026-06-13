<?php

it('script variables', function (): void {
    $this->withoutMix();

    $this->actingAs($this->admin, 'canvas')
        ->get(config('canvas.path'))
        ->assertSuccessful()
        ->assertViewIs('canvas::layout')
        ->assertViewHas('jsVars')
        ->assertSee('canvas');
});
