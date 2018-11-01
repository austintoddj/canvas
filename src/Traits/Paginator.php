<?php

namespace Canvas\Traits;

use Illuminate\Support\Collection;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;

trait Paginator
{
    /**
     * Generates pagination on a Collection or an array.
     *
     * @param array|Collection $items
     * @param int $perPage
     * @param int $page
     *
     * @return LengthAwarePaginator
     */
    protected function paginate($items, $perPage = 15, $page = null): LengthAwarePaginator
    {
        $descriptor = 'page';
        $page = $page ?: (Paginator::resolveCurrentPage($descriptor) ?: 1);
        $items = $items instanceof Collection ? $items : Collection::make($items);

        return new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            [
                'path'     => Paginator::resolveCurrentPath(),
                'pageName' => $descriptor,
            ]
        );
    }
}
