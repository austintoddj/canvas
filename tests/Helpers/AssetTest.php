<?php

namespace Canvas\Tests\Helpers;

use Canvas\Helpers\Asset;
use Canvas\Tests\TestCase;
use RuntimeException;

class AssetTest extends TestCase
{
    /** @test */
    public function it_can_check_for_up_to_date_published_assets()
    {
        $this->expectException(RuntimeException::class);

        Asset::upToDate();
    }
}
