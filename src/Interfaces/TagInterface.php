<?php

namespace Canvas\Interfaces;

use Canvas\Entities\Tag;
use Illuminate\Database\Eloquent\ModelNotFoundException;

interface TagInterface extends InterfaceAbstract
{
    /**
     * @param string $slug
     * @throws ModelNotFoundException
     * @return Tag
     */
    public function findBySlug(string $slug): Tag;
}
