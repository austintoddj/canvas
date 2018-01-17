<?php

namespace Tests;

class PublicRoutesTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_access_the_blog_index_page()
    {
        $response = $this->call('GET', '/');
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_a_blog_post_page()
    {
        $response = $this->call('GET', '/blog/post/hello-world');
        $this->assertEquals(200, $response->status());
        $this->see('Hello World');
    }

    /** @test */
    public function it_can_access_a_blog_tag_page()
    {
        $response = $this->call('GET', '/blog?tag=Getting+Started');
        $this->assertEquals(200, $response->status());
        $this->see('GETTING STARTED WITH CANVAS');
    }

    /** @test */
    public function it_can_access_the_login_page()
    {
        $response = $this->call('GET', '/admin');
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_the_forgot_password_page()
    {
        $this->visit('admin')->click('Forgot password')->seePageIs('password/forgot');
    }

    /** @test */
    public function it_will_receive_a_404_error_if_a_page_is_not_found()
    {
        $response = $this->call('GET', '/404ErrorPage');
        $this->assertEquals(404, $response->status());
    }
}
