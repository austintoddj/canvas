<?php

namespace Canvas;

class Canvas
{
    /**
     * Indicates if Canvas should utilize the dark mode.
     *
     * @var bool
     */
    public static $useDarkMode = false;

    /**
     * Specifies that Canvas should apply the dark mode.
     *
     * @return static
     */
    public static function night()
    {
        static::$useDarkMode = true;

        return new static;
    }
}
