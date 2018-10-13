<?php

namespace Canvas\Tests;

use Dotenv\Dotenv;
use Canvas\Entities\Tag;
use Canvas\Entities\Post;
use Canvas\Tests\Unit\User;
use Canvas\CanvasServiceProvider;
use Canvas\InterfaceServiceProvider;
use Illuminate\Database\Schema\Blueprint;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    /**
     * @var Post
     */
    protected $testPost;

    /**
     * @var Tag
     */
    protected $testTag;

    /**
     * @var User
     */
    protected $testUser;

    /**
     * @return void
     */
    public function setUp()
    {
        parent::setUp();

        $this->setUpDatabase($this->app);

        $this->testUser = User::first();
        $this->testPost = app(Post::class)->find(1);
        $this->testTag = app(Tag::class)->find(1);
    }

    /**
     * @param \Illuminate\Foundation\Application $app
     *
     * @return array
     */
    protected function getPackageProviders($app)
    {
        return [
            CanvasServiceProvider::class,
            InterfaceServiceProvider::class,
        ];
    }

    /**
     * Set up the environment.
     *
     * @param \Illuminate\Foundation\Application $app
     */
    protected function getEnvironmentSetUp($app)
    {
        // If we're not in TravisCI, load our local .env file
        if (empty(getenv('CI'))) {
            $envPath = realpath(__DIR__.'/..');
            if (! file_exists($envPath)) {
                $dotenv = new Dotenv($envPath);
                $dotenv->load();
            }
        }

        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);

        $app['config']->set('view.paths', [__DIR__.'/resources/views']);

        // Use test User model for users provider
        $app['config']->set('auth.providers.users.model', User::class);
    }

    /**
     * Set up the database.
     *
     * @param \Illuminate\Foundation\Application $app
     */
    protected function setUpDatabase($app)
    {
        $this->artisan('migrate:fresh');

        $app['db']->connection()->getSchemaBuilder()->create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('email');
            $table->softDeletes();
        });

        $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        User::create(['email' => 'test@user.com']);
        Post::create(['title' => 'post title', 'summary' => 'post summary', 'body' => 'post body', 'user_id' => 1]);
        Tag::create(['name' => 'tag name']);
    }

    /**
     * Refresh the testUser.
     */
    public function refreshTestUser()
    {
        $this->testUser = $this->testUser->fresh();
    }

    /**
     * Refresh the testPost.
     */
    public function refreshTestPost()
    {
        $this->testPost = $this->testPost->fresh();
    }

    /**
     * Refresh the testTag.
     */
    public function refreshTestTag()
    {
        $this->testTag = $this->testTag->fresh();
    }
}
