<?php
/*
|--------------------------------------------------------------------------
| Canvas Application Routes : Frontend
|--------------------------------------------------------------------------
*/
// Blog Index Page
Route::get('/', 'Frontend\BlogController@index');
Route::get('blog', 'Frontend\BlogController@index');

// Blog Post Page
Route::get('blog/{slug}', 'Frontend\BlogController@showPost');
/*
|--------------------------------------------------------------------------
| Canvas Application Routes : Backend
|--------------------------------------------------------------------------
*/
$router->group([
    'namespace'  => 'Backend',
    'middleware' => 'auth',
], function () {
    // Home Page
    Route::get('admin', 'HomeController@index');

    // Posts Page
    Route::resource('admin/post', 'PostController', ['except' => 'show']);

    // Tags Page
    Route::resource('admin/tag', 'TagController', ['except' => 'show']);

    // Uploads Page
    Route::get('admin/upload', 'UploadController@index')->name('admin/upload');
    Route::post('admin/upload/file', 'UploadController@ajaxUploadFile');
    Route::delete('admin/upload/file', 'UploadController@deleteFile');
    Route::post('admin/upload/folder', 'UploadController@createFolder');
    Route::delete('admin/upload/folder', 'UploadController@deleteFolder');

    // Profile Pages
    Route::get('admin/profile/privacy', 'ProfileController@editPrivacy')->name('admin.profile.privacy');
    Route::resource('admin/profile', 'ProfileController');

    // Search Page
    Route::resource('admin/search', 'SearchController');

    // Tools Page
    Route::get('admin/tools', 'ToolsController@index');
    Route::post('admin/tools/reset_index', 'ToolsController@resetIndex');
    Route::post('admin/tools/cache_clear', 'ToolsController@clearCache');
    Route::post('admin/tools/download_archive', 'ToolsController@handleDownload');
    Route::post('admin/tools/enable_maintenance_mode', 'ToolsController@enableMaintenanceMode');
    Route::post('admin/tools/disable_maintenance_mode', 'ToolsController@disableMaintenanceMode');
});

/*
|--------------------------------------------------------------------------
| Canvas Application Routes : Authentication
|--------------------------------------------------------------------------
*/
$router->group([
    'namespace' => 'Auth',
    'prefix'    => 'auth',
], function () {
    // Login
    Route::get('login', 'AuthController@getLogin');
    Route::post('login', 'AuthController@postLogin');

    // Logout
    Route::get('logout', 'AuthController@getLogout');

    // Passwords
    Route::post('password', 'PasswordController@updatePassword');
});
