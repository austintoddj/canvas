<?php

/**
 * Class PublicRoutesTest.
 *
 * Test the response code for each publicly accessible route.
 */
class PublicRoutesTest extends TestCase
{
    use InteractsWithDatabase;

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
     * Test the response code for the Blog Index page.
     *
     * @return void
     */
    public function testBlogIndexPageResponseCode()
    {
        $response = $this->call('GET', '/');
        $this->assertEquals(200, $response->status());
        $this->assertViewHas('user');
    }

    /**
     * Test the response code for the Blog Post page.
     *
     * @return void
     */
    public function testBlogPostPageResponseCode()
    {
        $response = $this->call('GET', '/blog/hello-world');
        $this->assertEquals(200, $response->status());
        $this->see('Hello World');
        $this->assertViewHas('user');
    }

    /**
     * Test the response code for a Blog Tag Page.
     *
     * @return void
     */
    public function testBlogTagPageResponseCode()
    {
        $response = $this->call('GET', '/blog?tag=Getting+Started');
        $this->assertEquals(200, $response->status());
        $this->see('GETTING STARTED WITH CANVAS');
        $this->assertViewHas('user');
    }

    /**
     * Test the response code for the Login page.
     *
     * @return void
     */
    public function testLoginPageResponseCode()
    {
        $response = $this->call('GET', '/admin');
        $this->assertEquals(200, $response->status());
    }

    /**
     * Test the response code for the 404 Error Page.
     *
     * @return void
     */
    public function test404ErrorPageResponseCode()
    {
        $response = $this->call('GET', '/404ErrorPage');
        $this->assertEquals(404, $response->status());
    }
}
