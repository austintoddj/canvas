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

    /** @test */
    public function it_can_check_the_installed_version()
    {
        $this->assertSame('', Canvas::installedVersion());
    }

    /** @test */
    public function it_can_get_the_available_language_codes()
    {
        $this->assertIsArray(Canvas::availableLanguageCodes());
    }

    /** @test */
    public function it_can_get_the_available_translations()
    {
        $this->assertIsString(Canvas::availableTranslations(config('app.locale')));
    }

    /** @test */
    public function it_can_get_the_available_roles()
    {
        $this->assertSame([
            User::CONTRIBUTOR => 'Contributor',
            User::EDITOR => 'Editor',
            User::ADMIN => 'Admin',
        ], Canvas::availableRoles());
    }

    /** @test */
    public function it_can_check_the_published_assets_are_up_to_date()
    {
        $this->assertSame(true, Canvas::assetsUpToDate());
    }

    /** @test */
    public function it_can_get_the_base_path()
    {
        $this->assertIsString(Canvas::basePath());
    }

    /** @test */
    public function it_can_get_the_base_storage_path()
    {
        $this->assertSame(config('canvas.storage_path').'/images', Canvas::baseStoragePath());
        $this->assertIsString(Canvas::baseStoragePath());
    }

    /** @test */
    public function it_can_check_for_valid_urls()
    {
        $response = Canvas::isValid('https://www.example.com');

        $this->assertTrue($response);

        $response = Canvas::isValid('://www.example.c');

        $this->assertFalse($response);
    }

    /** @test */
    public function it_can_trim_a_url()
    {
        $response = Canvas::trim('https://www.example.com?string-to-trim');

        $this->assertSame($response, 'www.example.com');
    }

    /** @test */
    public function it_can_generate_a_gravatar()
    {
        $size = 80;
        $default = 'identicon';
        $rating = 'pg';
        $response = Canvas::gravatar('user@example.com', $size, $default, $rating);

        $this->assertIsString($response);
        $this->assertStringContainsString('secure.gravatar.com', $response);
        $this->assertStringContainsString(sprintf('s=%s', $size), $response);
        $this->assertStringContainsString(sprintf('d=%s', $default), $response);
        $this->assertStringContainsString(sprintf('r=%s', $rating), $response);
    }
}
