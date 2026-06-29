<?php

use Canvas\Support\AuthorAvatar;
use Canvas\Support\Gravatar;

it('falls back to gravatar when avatar is empty', function (): void {
    $email = 'user@example.com';

    expect(AuthorAvatar::url(null, $email))->toBe(Gravatar::url($email));
});

it('returns absolute avatar urls unchanged', function (): void {
    $url = 'https://cdn.example.com/avatar.jpg';

    expect(AuthorAvatar::url($url, 'user@example.com'))->toBe($url);
});

it('builds gravatar urls from stored avatar hashes', function (): void {
    $hash = md5('user@example.com');

    expect(AuthorAvatar::url($hash, 'user@example.com'))
        ->toBe('https://secure.gravatar.com/avatar/'.$hash.'?s=200&d=retro&r=g');
});
