<?php

namespace Canvas\Traits;

use Canvas\Events\PostViewed;
use Canvas\Listeners\StoreViewData;

trait EventMap
{
    /**
     * All of the event / listener mappings.
     *
     * @var array
     */
    protected $events = [
        PostViewed::class => [
            StoreViewData::class,
        ],
    ];
}
