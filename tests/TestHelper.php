<?php

namespace Tests;

use Canvas\Helpers\CanvasHelper;

trait TestHelper
{
    /**
     * Get or post to a route as a user.
     *
     * @param  string           $route       The route's name.
     * @param  array|int|null   $routeData   The route's parameters.
     * @param  array|null       $requestData The data that should be posted to the server.
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
     * Assert that data can be found in the posts table.
     *
     * @param  array   $data
     * @param  bool $negate Should the assertion be negated (dontSeeInDatabase)
     * @return $this
     */
    protected function seePostInDatabase($data = ['title' => 'Foo'], $negate = false)
    {
        $method = $negate ? 'dontSeeInDatabase' : 'seeInDatabase';

        return $this->$method(CanvasHelper::TABLES['posts'], $data);
    }
    /**
     * Assert that data can be found in the tags table.
     *
     * @param  array   $data
     * @param  bool $negate Should the assertion be negated (dontSeeInDatabase)
     * @return $this
     */
    protected function seeTagInDatabase($data = ['title' => 'Foo'], $negate = false)
    {
        $method = $negate ? 'dontSeeInDatabase' : 'seeInDatabase';

        return $this->$method(CanvasHelper::TABLES['tags'], $data);
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
     * Assert that a tag model is not in the database by id.
     *
     * @param  int $id
     * @return $this
     */
    protected function dontSeeTagInDatabase($id)
    {
        return $this->seeTagInDatabase(['id' => $id], true);
    }
}
