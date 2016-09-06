<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Canvas Configuration : SEO
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the blog meta tags and SEO for your
    | application. These will be used for web scraping and open
    | graph tags on sites such as Facebook and Twitter.
    |
    */
    'title' => 'Canvas',
    'subtitle' => 'Minimal Blogging Platform',
    'description' => 'Blog',
    'author' => 'Todd Austin',
    'seo' => 'minimal,blogging,platform',

    /*
    |--------------------------------------------------------------------------
    | Canvas Configuration : Blog Posts
    |--------------------------------------------------------------------------
    |
    | Pretty self-explanatory here. Indicate how many posts you would like
    | to appear on each page. If you are using Disqus, specify the
    | identifier in your .env file.
    |
    */
    'posts_per_page' => 6,
    'disqus_name' => env('DISQUS_NAME', null),

    /*
    |--------------------------------------------------------------------------
    | Canvas Configuration : Media Uploads
    |--------------------------------------------------------------------------
    |
    | Specify what type of storage you would like for your application. Just
    | as a reminder, your uploads directory MUST be writable by the
    | web server for the uploading to function properly.
    |
    | Supported: "local"
    |
    */
    'uploads' => [
        'storage' => 'local',
        'webpath' => '/uploads/',
    ],

    /*
    |--------------------------------------------------------------------------
    | Canvas Configuration : Trim Width
    |--------------------------------------------------------------------------
    |
    | To make sure post subtitles and post excerpts display properly in
    | the application, we need to trim the width of them and simply
    | add an ellipses at the trim point.
    |
    | backend_trim_width: Used in the Posts Datatable
    | frontend_trim_width: Used in the Individual Post view
    |
    */
    'backend_trim_width' => 40,
    'frontend_trim_width' => 225,
];
