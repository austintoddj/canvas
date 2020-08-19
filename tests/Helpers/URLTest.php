<?php

namespace Canvas\Tests\Helpers;

use Canvas\Helpers\URL;
use Canvas\Tests\TestCase;

/**
 * Class URLTest.
 *
 * @covers \Canvas\Helpers\URL
 */
class URLTest extends TestCase
{
    /** @test */
    public function it_can_check_for_valid_urls()
    {
        $response = URL::isValid('https://www.example.com');

        $this->assertTrue($response);

        $response = URL::isValid('://www.example.c');

        $this->assertFalse($response);
    }

    /** @test */
    public function it_can_trim_a_url()
    {
        $response = URL::trim('https://www.example.com?string-to-trim');

        $this->assertSame($response, 'www.example.com');
    }

    /** @test */
    public function it_can_generate_a_gravatar()
    {
        $size = 80;
        $default = 'identicon';
        $rating = 'pg';
        $response = URL::gravatar('user@example.com', $size, $default, $rating);

        $this->assertIsString($response);
        $this->assertStringContainsString('secure.gravatar.com', $response);
        $this->assertStringContainsString(sprintf('s=%s', $size), $response);
        $this->assertStringContainsString(sprintf('d=%s', $default), $response);
        $this->assertStringContainsString(sprintf('r=%s', $rating), $response);
    }
}
