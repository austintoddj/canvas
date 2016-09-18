<?php

use App\Models\Tag;
use EGALL\EloquentPHPUnit\EloquentTestCase;

/**
 * Post model test.
 *
 * Test the application's post model.
 */
class PostTest extends EloquentTestCase
{
    /**
     * The post model's full namesapce.
     *
     * @var string
     */
    protected $model = 'App\Models\Post';

    /**
     * The user model.
     *
     * @var App\Models\User
     */
    private $user;

    /**
     * Create the user model test subject.
     *
     * @before
     * @return void
     */
    public function createUser()
    {
        $this->user = factory(App\Models\User::class)->create();
    }

    /**
     * Test the database table.
     *
     * @return void
     */
    public function testDatabaseTable()
    {
        $this->table->column('id')->integer()->increments();
        $this->table->column('title')->string()->notNullable();
        $this->table->column('subtitle')->string()->notNullable();
        $this->table->column('content_raw')->text()->notNullable();
        $this->table->column('page_image')->string()->nullable();
        $this->table->column('meta_description')->string()->nullable();
        $this->table->column('is_draft')->boolean()->defaults(0);
        $this->table->column('layout')->string()->defaults('frontend.blog.post');
        $this->table->column('published_at')->dateTime()->index();
        $this->table->hasTimestamps();
    }

    /**
     * Test the post-tag join table.
     *
     * @return void
     */
    public function testPostTagJoinTable()
    {
        $this->resetTable('post_tag');
        $this->table->column('tag_id')->integer()->primary();
        $this->table->column('post_id')->integer()->primary();
        $this->table->hasTimestamps();
    }

    /**
     * Test the model's properties & relationships.
     *
     * @return void
     */
    public function testModelProperties()
    {
        $this->hasFillable('title', 'subtitle', 'content_raw', 'page_image', 'meta_description', 'layout', 'is_draft', 'published_at', 'slug')
             ->hasCasts('published_at', 'is_draft')
             ->belongsToMany(Tag::class);
    }

    /**
     * Test creating a new post.
     *
     * @return void
     */
    public function testItCreatesPost()
    {
        $data = [
            'title'         => 'example',
            'slug'          => 'foo',
            'subtitle'      => 'bar',
            'content'       => 'FooBar',
            'published_at'  =>  Carbon\Carbon::now(),
            'layout'        => 'frontend.blog.post',
        ];

        $this->callRouteAsUser('admin.post.store', null, $data)
              ->seePostInDatabase(['title' => 'example', 'content_raw' => 'FooBar', 'content_html' => '<p>FooBar</p>'])
              ->seeInSession('_new-post', trans('messages.create_success', ['entity' => 'post']))
              ->assertRedirectedTo('admin/post');
    }

    /**
     * Test creating a post that fails validation.
     *
     * @return void
     */
    public function testItValidatesPostCreation()
    {
        $this->callRouteAsUser('admin.post.store', null, ['title' => 'example'])
             ->assertSessionHasErrors();
    }

    /**
     * Test editing a post model.
     *
     * @return void
     */
    public function testPostsCanBeEdited()
    {
        $this->callRouteAsUser('admin.post.edit', 1)
            ->submitForm('Save', ['title' => 'Foo'])
            ->see('Success! Post has been updated')
            ->see('Foo')
            ->seePostInDatabase();
    }

    /**
     * Test previewing a post model.
     *
     * @return void
     */
    public function testPostsCanBePreviewed()
    {
        $this->callRouteAsUser('admin.post.edit', 1)
             ->click('Preview')
             ->seePageIs('blog/hello-world');
    }

    /**
     * Test deleting a post model from the database.
     *
     * @return void
     */
    public function testPostsCanBeDeleted()
    {
        $this->callRouteAsUser('admin.post.edit', 1)
            ->press('Delete')
            ->dontSee($this->getDeleteMessage())
            ->press('Delete Post')
            ->see($this->getDeleteMessage())
            ->dontSeePostInDatabase(1);
    }

    /**
     * Get or post to a route as a user.
     *
     * @param  string           $route       The route's name.
     * @param  array|int|null   $routeData   The route's parameters.
     * @param  array|null       $requestData The data that should be posted to the server.
     * @return void
     */
    protected function callRouteAsUser($route, $routeData = null, $requestData = null)
    {
        $request = $this->actingAs($this->user);

        if (is_null($requestData)) {
            return $request->visit(route($route, $routeData));
        }

        return $request->post(route($route, $routeData), $requestData);
    }

    /**
     * Assert that a post model is not in the database by id.
     *
     * @param  int $id
     * @return $this
     */
    protected function dontSeePostInDatabase($id)
    {
        return $this->seePostInDatabase(['id' => $id], true);
    }

    /**
     * Get the post deletion success message.
     *
     * @return string
     */
    protected function getDeleteMessage()
    {
        return 'Success! Post has been deleted.';
    }

    /**
     * Assert that data can be found in the posts table.
     *
     * @param  array   $data
     * @param  bool $negate Should the assertion be negated (dontSeeInDatabase)
     * @return $this
     */
    protected function seePostInDatabase($data = ['title' => 'Foo'], $negate = false)
    {
        $method = $negate ? 'dontSeeInDatabase' : 'seeInDatabase';

        return $this->$method('posts', $data);
    }
}
