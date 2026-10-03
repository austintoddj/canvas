<?php

declare(strict_types=1);

use Canvas\Support\SocialProfiles;

it('normalizes handles and builds profile urls', function (): void {
    expect(SocialProfiles::normalizeHandle('x', 'https://twitter.com/ada'))->toBe('ada');
    expect(SocialProfiles::normalizeHandle('x', '@ada'))->toBe('ada');
    expect(SocialProfiles::normalizeHandle('github', 'https://github.com/canvas/'))->toBe('canvas');
    expect(SocialProfiles::normalizeHandle('medium', 'https://medium.com/@writer'))->toBe('writer');
    expect(SocialProfiles::normalizeHandle('bluesky', 'https://bsky.app/profile/ada.bsky.social'))->toBe('ada.bsky.social');
    expect(SocialProfiles::normalizeHandle('github', 'github.com/canvas'))->toBe('canvas');
    expect(SocialProfiles::normalizeHandle('linkedin', 'https://www.linkedin.com/in/ada-lovelace/'))->toBe('ada-lovelace');
    expect(SocialProfiles::normalizeHandle('youtube', 'https://www.youtube.com/@canvas/videos'))->toBe('canvas');
    expect(SocialProfiles::normalizeHandle('tiktok', 'https://www.tiktok.com/@ada/video/123'))->toBe('ada');
    expect(SocialProfiles::normalizeHandle('x', ''))->toBe('');

    expect(SocialProfiles::profileUrl('x', '@ada'))->toBe('https://x.com/ada');
    expect(SocialProfiles::profileUrl('medium', 'writer'))->toBe('https://medium.com/@writer');
    expect(SocialProfiles::profileUrl('linkedin', 'ada-lovelace'))->toBe('https://www.linkedin.com/in/ada-lovelace');
    expect(SocialProfiles::profileUrl('youtube', '@canvas'))->toBe('https://www.youtube.com/@canvas');
    expect(SocialProfiles::profileUrl('tiktok', 'ada'))->toBe('https://www.tiktok.com/@ada');
    expect(SocialProfiles::profileUrl('github', ''))->toBeNull();
});

it('keeps type prefixes for linkedin and youtube pages', function (): void {
    expect(SocialProfiles::normalizeHandle('linkedin', 'https://www.linkedin.com/company/acme/'))->toBe('company/acme');
    expect(SocialProfiles::normalizeHandle('linkedin', 'linkedin.com/school/mit/about'))->toBe('school/mit');
    expect(SocialProfiles::normalizeHandle('linkedin', 'https://www.linkedin.com/showcase/acme-labs'))->toBe('showcase/acme-labs');
    expect(SocialProfiles::normalizeHandle('linkedin', 'company/acme'))->toBe('company/acme');
    expect(SocialProfiles::normalizeHandle('youtube', 'https://www.youtube.com/channel/UC123abc/videos'))->toBe('channel/UC123abc');
    expect(SocialProfiles::normalizeHandle('youtube', 'https://www.youtube.com/c/canvas'))->toBe('c/canvas');
    expect(SocialProfiles::normalizeHandle('youtube', 'https://m.youtube.com/user/canvas'))->toBe('user/canvas');

    expect(SocialProfiles::profileUrl('linkedin', 'https://www.linkedin.com/company/acme'))->toBe('https://www.linkedin.com/company/acme');
    expect(SocialProfiles::profileUrl('linkedin', 'school/mit'))->toBe('https://www.linkedin.com/school/mit');
    expect(SocialProfiles::profileUrl('linkedin', 'company'))->toBe('https://www.linkedin.com/in/company');
    expect(SocialProfiles::profileUrl('youtube', 'channel/UC123abc'))->toBe('https://www.youtube.com/channel/UC123abc');
    expect(SocialProfiles::profileUrl('youtube', 'https://www.youtube.com/c/canvas'))->toBe('https://www.youtube.com/c/canvas');
    expect(SocialProfiles::profileUrl('youtube', 'user/canvas'))->toBe('https://www.youtube.com/user/canvas');
    expect(SocialProfiles::profileUrl('github', 'company/acme'))->toBe('https://github.com/company/acme');
});

it('normalizes social maps and drops unknown platforms', function (): void {
    expect(SocialProfiles::normalizeMap([
        'x' => 'https://x.com/ada',
        'github' => '',
        'myspace' => 'legacy',
        0 => 'ignored',
        'instagram' => ['not', 'a', 'string'],
    ]))->toBe([
        'x' => 'ada',
    ]);

    expect(SocialProfiles::normalizeMap([
        'x' => '  ',
    ]))->toBeNull();
});
