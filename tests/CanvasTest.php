<?php

namespace Canvas\Tests;

use Canvas\Canvas;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class CanvasTest.
 *
 * @covers \Canvas\Canvas
 */
class CanvasTest extends TestCase
{
    use RefreshDatabase;

    public function testInstalledVersion(): void
    {
        $this->assertEmpty(Canvas::installedVersion());
    }

    public function testAvailableLanguageCodes(): void
    {
        $this->assertIsArray(Canvas::availableLanguageCodes());
    }

    public function testAvailableTranslations(): void
    {
        $this->assertIsString(Canvas::availableTranslations(config('app.locale')));
    }

    public function testAssetsAreUpToDate(): void
    {
        $this->assertTrue(Canvas::assetsUpToDate());
    }

    public function testBasePath(): void
    {
        $this->assertSame(Canvas::basePath(), '/'.config('canvas.path'));

        $this->assertIsString(Canvas::basePath());
    }

    public function testBaseStoragePath(): void
    {
        $this->assertSame(config('canvas.storage_path').'/images', Canvas::baseStoragePath());

        $this->assertIsString(Canvas::baseStoragePath());
    }

    public function testParseReferer(): void
    {
        $this->assertSame(Canvas::parseReferer('https://www.example.com'), 'www.example.com');
        $this->assertNull(Canvas::parseReferer(null));
        $this->assertNull(Canvas::parseReferer('://www.example.c'));
    }

    public function testGravatar(): void
    {
        $size = 80;
        $default = 'identicon';
        $rating = 'pg';
        $url = Canvas::gravatar('user@example.com', $size, $default, $rating);

        $this->assertIsString($url);
        $this->assertStringContainsString('secure.gravatar.com', $url);
        $this->assertStringContainsString(sprintf('s=%s', $size), $url);
        $this->assertStringContainsString(sprintf('d=%s', $default), $url);
        $this->assertStringContainsString(sprintf('r=%s', $rating), $url);
    }

    public function testEnabledDarkMode(): void
    {
        $this->assertTrue(Canvas::enabledDarkMode(1));
        $this->assertFalse(Canvas::enabledDarkMode(0));
        $this->assertFalse(Canvas::enabledDarkMode(null));
    }

    public function testUsingRightToLeftLanguage(): void
    {
        $this->assertTrue(Canvas::usingRightToLeftLanguage('ar'));
        $this->assertTrue(Canvas::usingRightToLeftLanguage('fa'));
        $this->assertFalse(Canvas::usingRightToLeftLanguage('en'));
        $this->assertFalse(Canvas::usingRightToLeftLanguage(null));
    }
}
