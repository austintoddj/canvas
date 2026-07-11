<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

final class TaxonomyIndexQuery
{
    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public static function apply(Builder $query, Request $request): Builder
    {
        $search = $request->string('search')->trim()->toString();

        if ($search !== '') {
            $escaped = addcslashes($search, '%_\\');
            $query->where('name', 'like', '%'.$escaped.'%');
        }

        $sort = $request->string('sort')->toString();

        return match ($sort) {
            'posts' => $query->orderByDesc('posts_count'),
            'name' => $query->orderBy('name'),
            default => $query->latest(),
        };
    }
}
