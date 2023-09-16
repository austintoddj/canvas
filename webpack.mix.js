const mix = require('laravel-mix')
/* eslint-disable-next-line */
const BundleAnalyzerPlugin =
    require('webpack-bundle-analyzer').BundleAnalyzerPlugin

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.webpackConfig({
    plugins: [
        // new BundleAnalyzerPlugin(),
    ]
})
    .options({
        terser: {
            terserOptions: {
                compress: {
                    drop_console: true
                }
            }
        }
    })
    .setPublicPath('public')
    .copyDirectory('resources/img', 'public/img')
    .js('resources/js/app.js', 'public/js')
    .vue({ version: 3 })
    .postCss('resources/css/app.css', 'public/css', [require('tailwindcss')])
    .alias({
        '@': 'resources/js'
    })

if (mix.inProduction()) {
    mix.version()
}
