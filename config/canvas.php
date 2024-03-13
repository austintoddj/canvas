<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Canvas Database Connection
    |--------------------------------------------------------------------------
    |
    | This is the database connection you want Canvas to use while storing &
    | reading your content. By default Canvas uses the default one. However, you can change that
    | to anything you want.
    |
    */

    'database_connection' => env('CANVAS_DB_CONNECTION', 'mysql'),

    /*
    |--------------------------------------------------------------------------
    | Base Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Canvas will be accessible from. If the
    | domain is set to null, Canvas will reside under the defined base
    | path below. Otherwise, this will be used as the subdomain.
    |
    */

    'domain' => env('CANVAS_DOMAIN', null),

    /*
    |--------------------------------------------------------------------------
    | Base Path
    |--------------------------------------------------------------------------
    |
    | This is the URI where Canvas will be accessible from. If the path
    | is set to null, Canvas will reside under the same path name as
    | the application. Otherwise, this is used as the base path.
    |
    */

    'path' => env('CANVAS_PATH', 'canvas'),

    /*
    |--------------------------------------------------------------------------
    | Site URL
    |--------------------------------------------------------------------------
    |
    | This is the public URI where visitors can access your published
    | content. If the site URL is set to null, certain UI elements
    | will be omitted from the logged in dashboard experience.
    |
    */

    'site_url' => env('CANVAS_SITE_URL', null),

    /*
    |--------------------------------------------------------------------------
    | Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will be attached to every route in Canvas, giving you
    | the chance to add your own middleware to this list or change any of
    | the existing middleware. Or, you can simply stick with the list.
    |
    */

    'middleware' => [
        'web',
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage
    |--------------------------------------------------------------------------
    |
    | This is the storage disk Canvas will use to put file uploads. You may
    | use any of the disks defined in the config/filesystems.php file and
    | you may also change the maximum upload size from its 3MB default.
    |
    */

    'storage_disk' => env('CANVAS_STORAGE_DISK', 'local'),

    'storage_path' => env('CANVAS_STORAGE_PATH', 'public/canvas'),

    'upload_filesize' => env('CANVAS_UPLOAD_FILESIZE', 3145728),

    /*
    |--------------------------------------------------------------------------
    | Unsplash Integration
    |--------------------------------------------------------------------------
    |
    | Visit https://unsplash.com/oauth/applications to create a new Unsplash
    | app. Use the confidential Access Key given to you to integrate with
    | the API. Note that demo apps are limited to 50 requests per hour.
    |
    */

    'unsplash' => [
        'access_key' => env('CANVAS_UNSPLASH_ACCESS_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | E-Mail Notifications
    |--------------------------------------------------------------------------
    |
    | This option controls e-mail notifications that will be sent via the
    | default application mail driver. A default option is provided to
    | support the notification system as an opt-in feature.
    |
    |
    */

    'mail' => [
        'enabled' => env('CANVAS_MAIL_ENABLED', false),
    ],

];
