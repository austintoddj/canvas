<?php

use App\Models\Tag;
use EGALL\EloquentPHPUnit\EloquentTestCase;

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

    /** @test */
    public function the_database_table_has_all_of_the_correct_columns()
    {
        $this->table->column('id')->integer()->increments();
        $this->table->column('author_id')->integer()->notNullable();
        $this->table->column('title')->string()->notNullable();
        $this->table->column('subtitle')->string()->notNullable();
        $this->table->column('content_raw')->text()->notNullable();
        $this->table->column('page_image')->string()->nullable();
        $this->table->column('meta_description')->string()->nullable();
        $this->table->column('is_draft')->boolean()->defaults(0);
        $this->table->column('layout')->string()->defaults(config('blog.post_layout'));
        $this->table->column('published_at')->dateTime()->index();
        $this->table->hasTimestamps();
    }

    /** @test */
    public function the_post_tag_table_relationship()
    {
        $this->resetTable('post_tag');
        $this->table->column('tag_id')->integer()->primary();
        $this->table->column('post_id')->integer()->primary();
        $this->table->hasTimestamps();
    }

    /** @test */
    public function it_has_the_correct_model_properties()
    {
        $this->hasFillable('title', 'subtitle', 'content_raw', 'page_image', 'meta_description', 'layout', 'is_draft', 'published_at', 'slug')
             ->hasDates('published_at')
             ->belongsToMany(Tag::class);
    }

    /** @test */
    public function it_validates_the_post_create_form()
    {
        $this->callRouteAsUser('admin.post.store', null, ['title' => 'example'])
            ->assertSessionHasErrors();
    }

    /** @test */
    public function it_can_create_a_post_and_save_it_to_the_database()
    {
        $data = [
            'id'            => 2,
            'title'         => 'example',
            'slug'          => 'foo',
            'subtitle'      => 'bar',
            'content'       => 'FooBar',
            'published_at'  =>  Carbon\Carbon::now(),
            'layout'        => config('blog.post_layout'),
        ];

        $this->callRouteAsUser('admin.post.store', null, $data)
              ->seePostInDatabase(['title' => 'example', 'content_raw' => 'FooBar', 'content_html' => '<p>FooBar</p>'])
              ->seeInSession('_new-post', trans('messages.create_success', ['entity' => 'post']))
              ->assertRedirectedTo('admin/post/2/edit')
              ->assertSessionMissing('errors');
    }

    /** @test */
    public function it_can_edit_posts()
    {
        $this->callRouteAsUser('admin.post.edit', 1)
            ->submitForm('Update', ['title' => 'Foo'])
            ->see('Success! Post has been updated')
            ->see('Foo')
            ->seePostInDatabase();
    }

    /** @test */
    public function it_can_preview_a_post()
    {
        $this->callRouteAsUser('admin.post.edit', 1)
             ->click('permalink')
             ->seePageIs('blog/hello-world')
             ->assertSessionMissing('errors');
    }

    /** @test */
    public function it_can_delete_a_post_from_the_database()
    {
        $this->callRouteAsUser('admin.post.edit', 1)
             ->press('Delete Post')
             ->see($this->getDeleteMessage())
             ->dontSeePostInDatabase(1)
             ->assertSessionMissing('errors');
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
