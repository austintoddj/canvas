<?php

use Canvas\Support\Assets;

it('reports assets as up to date during tests', function (): void {
    expect(Assets::isUpToDate())->toBeTrue();
});
