<?php

return [

    'header'  => 'Stats',
    'subtext' => 'Click on a post below to see more detailed insights.',
    'empty'   => 'There are no published posts for which you can view stats.',
    'views'   => 'View(s)',
    'chart'   => [
        'view'  => 'view',
        'views' => 'Views (30 days)',
    ],
    'cards'   => [
        'views'      => [
            'title' => 'Views (30 days)',
        ],
        'posts'      => [
            'title' => 'Total posts',
        ],
        'publishing' => [
            'title'   => 'Publishing',
            'details' => [
                'published' => 'Published Post(s)',
                'drafts'    => 'Draft(s)',
            ],
        ],
    ],
    'details' => [
        'created'   => 'Created',
        'published' => 'Published on',
        'views'     => 'Views by traffic source',
        'reading'   => [
            'header' => 'Popular reading times',
            'time'   => 'min',
            'read'   => 'read',
        ],
        'empty'     => 'Waiting until your post has more views to show these insights.',
        'referer'   => [
            'other'   => 'Other',
            'unknown' => 'Post views in this category could not reliably determine a referrer. e.g. Incognito mode',
        ],
    ],

];
