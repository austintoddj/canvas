const elixir = require('laravel-elixir');

require('laravel-elixir-vue-2');

/*
 |--------------------------------------------------------------------------
 | Elixir Asset Management
 |--------------------------------------------------------------------------
 |
 | Elixir provides a clean, fluent API for defining some basic Gulp tasks
 | for your Laravel application. By default, we are compiling the Sass
 | file for our application, as well as publishing vendor resources.
 |
 */

elixir(function (mix) {

    // Sass Files
    mix.sass('frontend/frontend.scss');
    mix.sass('backend/backend.scss');
    mix.sass('../talvbansal/media-manager/css/media-manager.css');

    // Frontend JS Files
    mix.scripts([
        'jquery.min.js',
        'bootstrap.min.js',
        'frontend/**/*.js'
    ], 'public/js/frontend.js');

    // Vendor JS Files
    mix.scripts([
        'jquery.min.js',
        'bootstrap.min.js',
        'moment.min.js',
        'simplemde.min.js',
        'autosize.min.js',
        'bootstrap-select.js',
        'jquery.mask.min.js',
        'chosen.jquery.min.js',
        'jquery.bootgrid.min.js',
        'lightgallery.min.js',
        'sweet-alert.min.js',
        'waves.js',
        'jsvalidation.js',
        'jquery.mCustomScrollbar.concat.min.js',
        'fileinput.min.js',
        'bootstrap-datetimepicker.min.js',
        '../talvbansal/media-manager/js/media-manager.js'
    ], 'public/js/vendor.js');

    // Application JS Files
    mix.scripts([
        'functions.js',
        'bootstrap-growl.min.js'
    ], 'public/js/backend.js');

    mix.webpack('app.js')
        .scripts('app-vue.js');

    // Copy Media Manager SVG images into the public directory
    mix.copy( 'resources/assets/talvbansal/media-manager/fonts', 'public/fonts' );

});
