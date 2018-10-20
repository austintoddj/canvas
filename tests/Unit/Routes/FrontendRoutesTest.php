<?php

namespace Tests\Unit\Routes;

use Tests\TestCase;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;

class FrontendRoutesTest extends TestCase
{
    use InteractsWithDatabase;

    /** @test */
    public function it_can_access_the_blog_index_page()
    {
        // Actions
        $this->call('GET', route('canvas.home'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.home'))
            ->see(e(config('app.name')));
    }

    /** @test */
    public function it_can_access_a_blog_post_page()
    {
        // Actions
        $this->call('GET', route('canvas.blog.post.show', 'hello-world'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.blog.post.show', 'hello-world'))
            ->see(e('Hello World'));
    }

    /** @test */
    public function it_can_access_a_blog_tag_page()
    {
        // Actions
        $this->call('GET', env('APP_URL').'/blog?tag=Getting+Started');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(env('APP_URL').'/blog?tag=Getting+Started')
            ->see(e('GETTING STARTED WITH CANVAS'));
    }

    /** @test */
    public function it_can_access_the_login_page()
    {
        // Actions
        $this->call('GET', route('canvas.admin'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin'))
            ->see(e('Sign In'));
    }

    /** @test */
    public function it_can_access_the_forgot_password_page()
    {
        // Actions
        $this->call('GET', route('canvas.auth.password.forgot'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.auth.password.forgot'))
            ->see(e('Send Reset Link'));
    }

    /** @test */
    public function it_will_receive_a_404_error_if_a_page_is_not_found()
    {
        // Actions
        $this->call('GET', env('APP_URL').'/404Error');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_NOT_FOUND)
            ->see(e('404 - Page Not Found'));
    }
}
