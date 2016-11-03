const elixir = require('laravel-elixir');

require('laravel-elixir-vue-2');

var assetsPath = 'public/assets/';

elixir(function (mix) {

    // Sass files
    mix.sass('frontend/frontend.scss', assetsPath + 'css/');
    mix.sass('backend/backend.scss', assetsPath + 'css/');
    mix.sass('../talvbansal/media-manager/css/media-manager.css', assetsPath + 'css/');

    // Frontend JS files
    mix.scripts([
        'jquery.min.js',
        'bootstrap.min.js',
        'frontend/**/*.js'
    ], assetsPath + 'js/frontend.js');

    // Vendor JS files
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
    ], assetsPath + 'js/vendor.js');

    // Application JS files
    mix.scripts([
        'functions.js',
        'bootstrap-growl.min.js'
    ], assetsPath + 'js/backend.js');

    mix.webpack('app.js', assetsPath + 'js/app.js' )
        .scripts('app-vue.js', assetsPath + 'js/app-vue.js');

    // Copy images
    mix.copy('resources/assets/images', assetsPath + 'images');

    // Copy fonts
    mix.copy(['resources/assets/fonts', 'resources/assets/talvbansal/media-manager/fonts'], assetsPath + '/fonts');

    // Version the assets
    mix.version([
            // CSS files
            assetsPath + 'css/frontend.css',
            assetsPath + 'css/backend.css',

            // JS files
            assetsPath + 'js/frontend.js',
            assetsPath + 'js/vendor.js',
            assetsPath + 'js/app.js'
        ]);

    // Run unit tests and generate reports each time Gulp is run
    // mix.phpUnit();
});
