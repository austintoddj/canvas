<?php

namespace Canvas;

trait EventMap
{
    /**
     * All of the event / listener mappings.
     *
     * @var array
     */
    protected $events = [
        Events\PostViewed::class => [
            Listeners\IncrementViewCount::class,
        ],
    ];
}
