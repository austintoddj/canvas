<?php

use Canvas\Support\Vite;

it('renders vite tags using the canvas build directory', function (): void {
    $html = (string) Vite::tags();

    expect($html)
        ->toContain('vendor/canvas/assets/')
        ->toContain('type="module"');
});
