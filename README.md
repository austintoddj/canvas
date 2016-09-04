## Canvas

<img src="https://raw.githubusercontent.com/austintoddj/canvas/gh-pages/img/readme.jpg" alt="Canvas Screens">

<a href="https://travis-ci.org/austintoddj/canvas" target="_blank"><img src="https://travis-ci.org/austintoddj/canvas.svg?branch=master" alt="Build Status"></a>
<a href="https://styleci.io/repos/52815899" target="_blank"><img src="https://styleci.io/repos/52815899/shield?style=flat" alt="StyleCI"></a>
<a href="https://github.com/austintoddj/canvas/issues"><img src="https://img.shields.io/github/issues/austintoddj/canvas.svg" alt="GitHub Issues"></a>
<a href="https://packagist.org/packages/austintoddj/canvas" target="_blank"><img src="https://poser.pugx.org/austintoddj/canvas/downloads" alt="Total Downloads"></a>
<a href="https://github.com/austintoddj/canvas/stargazers"><img src="https://img.shields.io/github/stars/austintoddj/canvas.svg" alt="Stars"></a>
<a href="https://github.com/austintoddj/canvas/network"><img src="https://img.shields.io/github/forks/austintoddj/canvas.svg" alt="GitHub Forks"></a>
<a href="https://packagist.org/packages/austintoddj/canvas" target="_blank"><img src="https://poser.pugx.org/austintoddj/canvas/v/stable" alt="Latest Stable Version"></a>
<a href="https://github.com/austintoddj/canvas/blob/master/LICENSE"><img src="https://poser.pugx.org/austintoddj/canvas/license" alt="License"></a>

[Canvas](http://canvas.toddaustin.io) is a simple, powerful blog publishing platform that lets you to share your stories with the world. Its beautifully designed interface and completely customizable framework allows you to write and publish your own blog, giving you the tools to make it easy and even fun to do. It is inspired by [Google Material Design](https://material.google.com), powered by [Laravel](https://laravel.com) and features [SimpleMDE](https://simplemde.com) for Markdown writing, site searching by [TNTSearch](https://github.com/teamtnt/tntsearch), native [Google Analytics](https://www.google.com/analytics/#?modal_active=none) integration and more!

## Requirements

Before you proceed make sure your server meets the following requirements:

- [Composer](https://getcomposer.org/)
- [PHP](https://php.net/) >= 5.6.4
- PHP Extensions ([PDO](http://php.net/manual/en/book.pdo.php), [SQLite](http://php.net/manual/en/book.sqlite.php), [OpenSSL](http://php.net/manual/en/book.openssl.php), [Mbstring](http://php.net/manual/en/book.mbstring.php), [Tokenizer](http://php.net/manual/en/book.tokenizer.php))
- PDO compliant database (SQL, MySQL, PostgreSQL, SQLite)

## Installation

1. There are 3 ways of downloading the application:
    * Use [GitHub](https://github.com): simply click the `Clone or download` button at the top right of this page and choose `Download ZIP`
    * Use [Git](https://git-scm.com): `git clone https://github.com/austintoddj/canvas.git`
    * Use [Packagist](https://packagist.org): `composer create-project austintoddj/canvas`

2. From the command line in the project root, run `composer install`
3. Give the `uploads/` directory write-access by the web server: `chown -R www-data:www-data public/uploads/`
4. Copy the contents of `.env.example` and create a new file called `.env` in the project root. Set your application variables in the new file.
5. Run `php artisan canvas:install` and follow the on-screen prompts.
6. To build the initial search index, run `php artisan canvas:index`
7. Change the permissions of the `storage/` directory: `chmod -R 777 storage/`
8. Sign in to the application at `http://YOUR_DOMAIN/admin`
    * Email: `admin@canvas.com`
    * Password: `password`

**Congratulations!** Your new blog is set up and ready to go. Feeling adventurous? Continue on with the advanced options below to get even more out of Canvas.

## Advanced Options

1. Child Themes
    * Run `npm install` from the project root
    * Run `npm install gulp`
    * Child theme files are already waiting for you at `resources/assets/sass/`
    * After any changes in these files, run `gulp`

2. Google Analytics
    * Set up a web property on [Google Analytics](https://www.google.com/analytics/#?modal_active=none).
    * Enter your tracking ID (`GA_ID`) into the `.env` file.
    * Enable Google Analytics in the `.env` file by setting `GA_ENABLE` to `true`

3. Disqus Integration
    * Generate a unique shortname from [Official Documentation](https://help.disqus.com/customer/portal/articles/466208-what-s-a-shortname-).
    * Enter your shortname (`DISQUS_NAME`) into the `.env` file.

## Contributing

Thank you for considering contributing to Canvas! The [contribution guide](https://github.com/austintoddj/Canvas/blob/master/CONTRIBUTING.md) provides instructions on how to [submit an issue](https://github.com/austintoddj/canvas/issues), [create pull requests](https://github.com/austintoddj/canvas/pulls) and more. It also has details about joining the official [HipChat group](https://canvas-blog.hipchat.com/home) for those who want to be a part of Canvas' future development.

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/austintoddj/Canvas/releases).

## License

Canvas is open-sourced software licensed under the [MIT license](https://github.com/austintoddj/Canvas/blob/master/LICENSE).
