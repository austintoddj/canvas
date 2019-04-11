<?php

declare(strict_types=1);

namespace Canvas\Tests\Services;

use Canvas\Tests\TestCase;
use Canvas\Contracts\NumberFormatter;
use Canvas\Services\SuffixedNumberFormatter;

/**
 * Class SuffixedNumberFormatterTest.
 *
 * @coversDefaultClass \Canvas\Services\SuffixedNumberFormatter
 *
 * @internal
 */
final class SuffixedNumberFormatterTest extends TestCase
{
    /**
     * @var NumberFormatter
     */
    private $subject;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->subject = new SuffixedNumberFormatter();
    }

    /**
     * @test
     * @covers ::format
     * @covers ::getPowerAndSuffix
     * @dataProvider numberProvider
     *
     * @param int    $number
     * @param string $expectedResult
     * @param int    $precision
     */
    public function it_formats_numbers_as_expected(int $number, string $expectedResult, int $precision = 1): void // @codingStandardsIgnoreLine
    {
        $this->assertSame($expectedResult, $this->subject->format($number, $precision));
    }

    /**
     * @return array
     */
    public function numberProvider(): array
    {
        return [
            'un-formatted' => [899, '899'],
            'thousands' => [899999, '900K'],
            'millions' => [899999999, '900M'],
            'billions' => [899999999999, '900B'],
            'trillions' => [899999999999999, '900T'],
            'with precision' => [12345, '12.345K', 3],
        ];
    }
}
