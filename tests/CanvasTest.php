<?php

namespace Canvas\Tests;

use Canvas\Canvas;
use Canvas\Models\User;
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

    public function testAvailableRoles(): void
    {
        $this->assertSame([
            User::CONTRIBUTOR => 'Contributor',
            User::EDITOR => 'Editor',
            User::ADMIN => 'Admin',
        ], Canvas::availableRoles());
    }

    public function testAssetsAreUpToDate(): void
    {
        $this->withoutMix();

        $this->assertTrue(Canvas::assetsUpToDate());
    }

    public function testBasePath(): void
    {
        $this->assertIsString(Canvas::basePath());
    }

    public function testBaseStoragePath(): void
    {
        $this->assertSame(config('canvas.storage_path').'/images', Canvas::baseStoragePath());
        $this->assertIsString(Canvas::baseStoragePath());
    }

    public function testURLIsValid(): void
    {
        $this->assertTrue(Canvas::isValid('https://www.example.com'));

        $this->assertFalse(Canvas::isValid('://www.example.c'));
    }

    public function testTrimURL(): void
    {
        $url = Canvas::trim('https://www.example.com?string-to-trim');

        $this->assertSame($url, 'www.example.com');
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
}
