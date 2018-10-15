<?php

namespace Canvas;

trait ServiceBindings
{
    /**
     * All of the service bindings for Canvas.
     *
     * @var array
     */
    public $serviceBindings = [
        // Repository services...
        Interfaces\PostInterface::class => Repositories\Eloquent\PostRepository::class,
        Interfaces\TagInterface::class => Repositories\Eloquent\TagRepository::class,
    ];
}
