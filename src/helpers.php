<?php

if (! function_exists('is_fresh')) {
    /**
     * Return true if the given ID is for a new resource.
     *
     * @param string $id
     * @return bool
     */
    function is_fresh(string $id): bool
    {
        return $id === 'create';
    }
}
