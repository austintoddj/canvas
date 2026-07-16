<?php

declare(strict_types=1);

use Canvas\Support\SocialProfiles;

it('normalizes handles and builds profile urls', function (): void {
    expect(SocialProfiles::normalizeHandle('x', 'https://twitter.com/ada'))->toBe('ada');
    expect(SocialProfiles::normalizeHandle('x', '@ada'))->toBe('ada');
    expect(SocialProfiles::normalizeHandle('github', 'https://github.com/canvas/'))->toBe('canvas');
    expect(SocialProfiles::normalizeHandle('medium', 'https://medium.com/@writer'))->toBe('writer');
    expect(SocialProfiles::normalizeHandle('bluesky', 'https://bsky.app/profile/ada.bsky.social'))->toBe('ada.bsky.social');

    expect(SocialProfiles::profileUrl('x', '@ada'))->toBe('https://x.com/ada');
    expect(SocialProfiles::profileUrl('medium', 'writer'))->toBe('https://medium.com/@writer');
    expect(SocialProfiles::profileUrl('github', ''))->toBeNull();
});

it('normalizes social maps and drops unknown platforms', function (): void {
    expect(SocialProfiles::normalizeMap([
        'x' => 'https://x.com/ada',
        'github' => '',
        'myspace' => 'legacy',
        0 => 'ignored',
    ]))->toBe([
        'x' => 'ada',
    ]);

    expect(SocialProfiles::normalizeMap([
        'x' => '  ',
    ]))->toBeNull();
});
