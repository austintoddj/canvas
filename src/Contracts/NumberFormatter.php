<?php

declare(strict_types=1);

namespace Canvas\Contracts;

interface NumberFormatter
{
    /**
     * Return a number formatted with a suffix.
     *
     * @param int $number
     * @param int $precision
     *
     * @return string
     */
    public function format(int $number, int $precision): string;
}
