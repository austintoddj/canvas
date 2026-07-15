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
    | Canvas resolves the host application's user model through this class.
    | Canvas reads identity from the host user model and stores all Canvas
    | profile, preference, and access data in canvas_users.
    |
    */

    'user_model' => env('CANVAS_USER_MODEL', 'App\Models\User'),

    /*
    |--------------------------------------------------------------------------
    | Auth Guard
    |--------------------------------------------------------------------------
    |
    | This is the guard Canvas uses to resolve authenticated users. Host apps
    | may point this at a dedicated staff guard or leave the default Canvas
    | guard in place during the transition.
    |
    */

    'guard' => env('CANVAS_GUARD', 'web'),

    /*
    |--------------------------------------------------------------------------
    | Languages
    |--------------------------------------------------------------------------
    |
    | Authors pick a language (stored as BCP-47 locale on canvas_users) from
    | the package catalog. Set CANVAS_LOCALES to a comma-separated subset of
    | catalog codes to restrict the picker (e.g. "en,es-MX,pt-BR"). Unknown
    | codes are ignored; an empty list uses the full catalog.
    |
    */

    'locales' => ($locales = env('CANVAS_LOCALES')) ? array_values(array_filter(array_map('trim', explode(',', $locales)))) : [],

    /*
    |--------------------------------------------------------------------------
    | Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware are applied to all Canvas routes in addition to the
    | native auth middleware (`auth:{guard}`) derived from the configured
    | Canvas guard. Keep this list for app-level concerns like tenancy,
    | throttling, or custom request context.
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
