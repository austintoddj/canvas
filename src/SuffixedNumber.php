<?php

namespace Canvas;

class SuffixedNumber
{
    /**
     * Return a number formatted with a suffix.
     *
     * @param int $n
     * @param int $precision
     * @return string
     */
    public static function format(int $n, $precision = 1): string
    {
        if ($n < 900) {
            $n_format = number_format($n, $precision);
            $suffix = '';
        } elseif ($n < 900000) {
            $n_format = number_format($n / 1000, $precision);
            $suffix = 'K';
        } elseif ($n < 900000000) {
            $n_format = number_format($n / 1000000, $precision);
            $suffix = 'M';
        } elseif ($n < 900000000000) {
            $n_format = number_format($n / 1000000000, $precision);
            $suffix = 'B';
        } else {
            $n_format = number_format($n / 1000000000000, $precision);
            $suffix = 'T';
        }

        if ($precision > 0) {
            $dot_zero = '.'.str_repeat('0', $precision);
            $n_format = str_replace($dot_zero, '', $n_format);
        }

        return sprintf('%s%s', $n_format, $suffix);
    }
}
