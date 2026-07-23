<?php

return [

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
    | User Model
    |--------------------------------------------------------------------------
    |
    | This is the host user model Canvas will use to resolve authors.
    | Canvas reads identity from that model, while profile data and
    | access records are stored in the canvas_users table.
    |
    */

    'user_model' => env('CANVAS_USER_MODEL', 'App\Models\User'),

    /*
    |--------------------------------------------------------------------------
    | Auth Guard
    |--------------------------------------------------------------------------
    |
    | This option controls which authentication guard Canvas uses to
    | resolve the current host user. You may use a dedicated staff
    | guard or leave the default web guard for shared sessions.
    |
    */

    'guard' => env('CANVAS_GUARD', 'web'),

    /*
    |--------------------------------------------------------------------------
    | Languages
    |--------------------------------------------------------------------------
    |
    | This option limits which languages authors may pick from the package
    | catalog. Provide a comma-separated list of BCP-47 codes, or leave
    | the list empty to offer every language in the catalog.
    |
    */

    'locales' => ($locales = env('CANVAS_LOCALES')) ? array_values(array_filter(array_map('trim', explode(',', $locales)))) : [],

    /*
    |--------------------------------------------------------------------------
    | Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will be assigned to every Canvas route along with
    | the authentication middleware derived from your configured guard.
    | Use this list for tenancy, throttling, or similar host concerns.
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
    | use any of the disks defined in config/filesystems.php and you may
    | also configure the path where files are to be stored.
    |
    */

    'storage_disk' => env('CANVAS_STORAGE_DISK', 'public'),

    'storage_path' => env('CANVAS_STORAGE_PATH', 'canvas'),

    'upload_filesize' => env('CANVAS_UPLOAD_FILESIZE', 3145728),

    /*
    |--------------------------------------------------------------------------
    | E-Mail
    |--------------------------------------------------------------------------
    |
    | This option enables the weekly author digest. Canvas schedules the
    | command each Monday at 08:00 and queues mailables (ShouldQueue),
    | so run a worker unless your queue connection is set to sync.
    |
    */

    'mail' => [
        'enabled' => env('CANVAS_MAIL_ENABLED', false),
    ],

];
