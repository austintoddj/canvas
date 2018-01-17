<?php

namespace Tests;

use Canvas\Models\User;

trait CreatesUser
{
    /**
     * The user model.
     *
     * @var Canvas\Models\User
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
        $this->user = factory(User::class)->create();
    }
}
