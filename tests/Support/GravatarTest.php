<?php

use Canvas\Support\Gravatar;

it('returns a gravatar URL', function (): void {
    $size = 80;
    $default = 'identicon';
    $rating = 'pg';
    $url = Gravatar::url('user@example.com', $size, $default, $rating);

    expect($url)
        ->toContain('secure.gravatar.com')
        ->toContain(sprintf('s=%s', $size))
        ->toContain(sprintf('d=%s', $default))
        ->toContain(sprintf('r=%s', $rating));
});
