<?php

declare(strict_types=1);

use Canvas\Support\AuthorAvatar;

it('returns null when avatar is empty', function (): void {
    expect(AuthorAvatar::url(null))->toBeNull()
        ->and(AuthorAvatar::url(''))->toBeNull()
        ->and(AuthorAvatar::url('   '))->toBeNull();
});

it('returns absolute avatar urls unchanged', function (): void {
    $url = 'https://cdn.example.com/avatar.jpg';

    expect(AuthorAvatar::url($url))->toBe($url);
});

it('returns null for non-url avatar values', function (): void {
    expect(AuthorAvatar::url('not-a-url'))->toBeNull()
        ->and(AuthorAvatar::url(md5('user@example.com')))->toBeNull();
});
