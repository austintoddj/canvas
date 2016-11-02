<?php

namespace App\Console\Commands;

use Artisan;
use ConfigWriter;
use App\Models\User;
use App\Models\Settings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class Install extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:install';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install and configure Canvas';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->comment(PHP_EOL.'Welcome to Canvas! You\'ll be up and running in no time...');
        $config = new ConfigWriter('blog');

        // Database Setup
        if (! Schema::hasTable('migrations')) {
            $this->comment(PHP_EOL.'Creating your database...');
            $exitCode = $this->call('migrate', [
                '--seed' => true,
            ]);
            $this->progress(5);
            $this->line(PHP_EOL.'<info>✔</info> Success! Your database is set up and configured.');
        }

        $this->comment(PHP_EOL.'Please provide the following information. Don\'t worry, you can always change these settings later.');

        // Admin User
        $this->comment(PHP_EOL.'Step 1/6: Creating the admin user');
        $this->call('user:create', ['--admin' => true]);
        $this->progress(1);

        // Blog Title
        $blogTitle = $this->ask('Step 2/6: Title of your blog');
        $this->title($blogTitle);
        $this->line(PHP_EOL.'<info>✔</info> Success! The title of the blog has been saved.');

        // Blog Subtitle
        $blogSubtitle = $this->ask('Step 3/6: Subtitle of your blog');
        $this->subtitle($blogSubtitle);
        $this->line(PHP_EOL.'<info>✔</info> Success! The subtitle of the blog has been saved.');

        // Blog Description
        $blogDescription = $this->ask('Step 4/6: Description of your blog');
        $this->description($blogDescription);
        $this->line(PHP_EOL.'<info>✔</info> Success! The description of the blog has been saved.');

        // Blog SEO
        $blogSEO = $this->ask('Step 5/6: Blog SEO keywords (simple,powerful,blog,publishing,platform)');
        $this->seo($blogSEO);
        $this->line(PHP_EOL.'<info>✔</info> Success! The blog SEO keywords have been saved.');

        // Posts Per Page
        $postsPerPage = $this->ask('Step 6/6: Number of posts to display per page');
        $this->postsPerPage($postsPerPage, $config);
        $this->line(PHP_EOL.'<info>✔</info> Success! The number of posts per page has been saved.');

        // Search Index
        $this->comment(PHP_EOL.'Building the search index...');
        $exitCode = Artisan::call('canvas:index');
        $this->progress(5);
        $this->line(PHP_EOL.'<info>✔</info> Success! The application search index has been built.');

        // Application Key Generation
        $this->comment(PHP_EOL.'Creating a unique application key...');
        $exitCode = Artisan::call('key:generate');
        $this->progress(5);
        $this->line(PHP_EOL.'<info>✔</info> Success! A unique application key has been generated.');

        // Additional Settings
        $this->comment(PHP_EOL.'Finishing up the installation...');
        $this->disqus();
        $this->googleAnalytics();
        $this->twitterCardType();
        $this->canvasVersion();
        $this->progress(5);

        $this->line(PHP_EOL.'<info>✔</info> Canvas has been installed. Pretty easy huh?'.PHP_EOL);

        $headers = ['Login Email', 'Login Password'];
        $data = User::select('email', 'password')->get()->toArray();
        $data[0]['password'] = 'Your chosen password.';
        $this->table($headers, $data);

        $config->save();
    }

    private function progress($tasks)
    {
        $bar = $this->output->createProgressBar($tasks);

        for ($i = 0; $i < $tasks; $i++) {
            time_nanosleep(0, 200000000);
            $bar->advance();
        }

        $bar->finish();
    }

    private function title($blogTitle)
    {
        $settings = new Settings();
        $settings->setting_name = 'blog_title';
        $settings->setting_value = $blogTitle;
        $settings->save();
        $this->comment('Saving blog title...');
        $this->progress(1);
    }

    private function subtitle($blogSubtitle)
    {
        $settings = new Settings();
        $settings->setting_name = 'blog_subtitle';
        $settings->setting_value = $blogSubtitle;
        $settings->save();
        $this->comment('Saving blog subtitle...');
        $this->progress(1);
    }

    private function description($blogDescription)
    {
        $settings = new Settings();
        $settings->setting_name = 'blog_description';
        $settings->setting_value = $blogDescription;
        $settings->save();
        $this->comment('Saving blog description...');
        $this->progress(1);
    }

    private function seo($blogSeo)
    {
        $settings = new Settings();
        $settings->setting_name = 'blog_seo';
        $settings->setting_value = $blogSeo;
        $settings->save();
        $this->comment('Saving blog SEO keywords...');
        $this->progress(1);
    }

    private function postsPerPage($postsPerPage, $config)
    {
        $config->set('posts_per_page', intval($postsPerPage));
        $this->comment('Saving posts per page...');
        $this->progress(1);
    }

    private function disqus()
    {
        $settings = new Settings();
        $settings->setting_name = 'disqus_name';
        $settings->setting_value = null;
        $settings->save();
    }

    private function googleAnalytics()
    {
        $settings = new Settings();
        $settings->setting_name = 'ga_id';
        $settings->setting_value = null;
        $settings->save();
    }

    private function twitterCardType()
    {
        $settings = new Settings();
        $settings->setting_name = 'twitter_card_type';
        $settings->setting_value = 'none';
        $settings->save();
    }

    private function canvasVersion()
    {
        $settings = new Settings();
        $settings->setting_name = 'canvas_version';
        $settings->setting_value = config('blog.version');
        $settings->save();
    }
}
