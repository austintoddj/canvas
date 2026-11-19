<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Canvas\Support\ContentLocales;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ContentLocale
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale');
        abort_unless(is_string($locale) && in_array($locale, ContentLocales::all(), true), 404);
        $previous = app()->getLocale();
        $request->attributes->set('canvas_content_locale', $locale);
        $request->route()->forgetParameter('locale');
        app()->setLocale($locale);
        try {
            return $next($request);
        } finally {
            app()->setLocale($previous);
        }
    }
}
