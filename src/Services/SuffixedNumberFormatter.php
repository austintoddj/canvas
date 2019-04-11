<?php

declare(strict_types=1);

namespace Canvas\Services;

use Canvas\Contracts\NumberFormatter;

class SuffixedNumberFormatter implements NumberFormatter
{
    private const DEFAULT_PRECISION = 1;
    private const SUFFIX_NONE = '';
    private const SUFFIX_THOUSAND = 'K';
    private const SUFFIX_MILLION = 'M';
    private const SUFFIX_BILLION = 'B';
    private const SUFFIX_TRILLION = 'T';
    private const BASE = 10;
    private const BOUNDARY_NO_SUFFIX = 900;
    private const BOUNDARY_THOUSAND = 900000;
    private const BOUNDARY_MILLION = 900000000;
    private const BOUNDARY_BILLION = 900000000000;
    private const PRECISION_PLACEHOLDER = '0';

    /**
     * Return a number formatted with a suffix.
     *
     * @param int $number
     * @param int $precision
     *
     * @return string
     */
    public function format(int $number, int $precision = self::DEFAULT_PRECISION): string
    {
        list($power, $suffix) = self::getPowerAndSuffix($number);
        $divisor = pow(self::BASE, $power);
        $formattedNumber = number_format($number/$divisor, $precision);

        if ($precision > 0) {
            $dotZero = '.' . str_repeat(self::PRECISION_PLACEHOLDER, $precision);
            $formattedNumber = str_replace($dotZero, '', $formattedNumber);
        }

        return sprintf('%s%s', $formattedNumber, $suffix);
    }

    /**
     * @param int $number
     *
     * @return array
     */
    private static function getPowerAndSuffix(int $number): array
    {
        if ($number < self::BOUNDARY_NO_SUFFIX) {
            $power = 0;
            $suffix = self::SUFFIX_NONE;
        } elseif ($number < self::BOUNDARY_THOUSAND) {
            $power = 3;
            $suffix = self::SUFFIX_THOUSAND;
        } elseif ($number < self::BOUNDARY_MILLION) {
            $power = 6;
            $suffix = self::SUFFIX_MILLION;
        } elseif ($number < self::BOUNDARY_BILLION) {
            $power = 9;
            $suffix = self::SUFFIX_BILLION;
        } else {
            $power = 12;
            $suffix = self::SUFFIX_TRILLION;
        }

        return [$power, $suffix];
    }
}
