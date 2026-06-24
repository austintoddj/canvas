<?php

use Canvas\Canvas;

it('returns the installed version', function (): void {
    $this->assertEmpty(Canvas::installedVersion());
});
it('returns available language codes', function (): void {
    $this->assertIsArray(Canvas::availableLanguageCodes());
});
it('returns available translations', function (): void {
    $this->assertIsString(Canvas::availableTranslations(config('app.locale')));
});
it('returns available roles', function (): void {
    $this->assertSame([
        1 => 'Contributor',
        2 => 'Editor',
        3 => 'Admin',
    ], Canvas::availableRoles());
});
it('assets are up to date', function (): void {
    $this->assertTrue(Canvas::assetsUpToDate());
});
it('returns the base path', function (): void {
    $this->assertSame(Canvas::basePath(), '/'.config('canvas.path'));

    $this->assertIsString(Canvas::basePath());
});
it('returns the base storage path', function (): void {
    $this->assertSame(config('canvas.storage_path').'/images', Canvas::baseStoragePath());

    $this->assertIsString(Canvas::baseStoragePath());
});
it('parses the referer', function (): void {
    $this->assertSame(Canvas::parseReferer('https://www.example.com'), 'www.example.com');
    $this->assertNull(Canvas::parseReferer(null));
    $this->assertNull(Canvas::parseReferer('://www.example.c'));
});
it('returns a gravatar URL', function (): void {
    $size = 80;
    $default = 'identicon';
    $rating = 'pg';
    $url = Canvas::gravatar('user@example.com', $size, $default, $rating);

    $this->assertIsString($url);
    $this->assertStringContainsString('secure.gravatar.com', $url);
    $this->assertStringContainsString(sprintf('s=%s', $size), $url);
    $this->assertStringContainsString(sprintf('d=%s', $default), $url);
    $this->assertStringContainsString(sprintf('r=%s', $rating), $url);
});
it('detects enabled dark mode', function (): void {
    $this->assertTrue(Canvas::enabledDarkMode(1));
    $this->assertFalse(Canvas::enabledDarkMode(0));
    $this->assertFalse(Canvas::enabledDarkMode(null));
});
it('detects right-to-left languages', function (): void {
    $this->assertTrue(Canvas::usingRightToLeftLanguage('ar'));
    $this->assertTrue(Canvas::usingRightToLeftLanguage('fa'));
    $this->assertFalse(Canvas::usingRightToLeftLanguage('en'));
    $this->assertFalse(Canvas::usingRightToLeftLanguage(null));
});
