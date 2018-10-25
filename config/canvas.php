<?php

use Canvas\Http\Middleware\Authorize;

return [

    'public_path' => 'blog',

    'middleware' => [
        'web',
        Authorize::class,
    ],

];
