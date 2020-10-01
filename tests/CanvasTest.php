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
    public function it_can_get_the_base_storage_path()
    {
        $this->assertSame(config('canvas.storage_path').'/images', Canvas::baseStoragePath());
        $this->assertIsString(Canvas::baseStoragePath());
    }
}
