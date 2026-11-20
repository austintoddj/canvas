<?php

declare(strict_types=1);

namespace Canvas\Support;

final class ReaderUrl
{
    /** @param array<string, mixed>|string $parameters */
    public static function route(string $name, array|string $parameters = [], ?string $locale = null): string
    {
        if (is_string($parameters)) {
            $key = $name === 'canvas-ui.author' ? 'username' : 'slug';
            $parameters = [$key => $parameters];
        }
        $route = app('router')->getRoutes()->getByName($name);
        if (ContentLocales::enabled() && ($route !== null && in_array('locale', $route->parameterNames(), true))) {
            $parameters['locale'] = $locale ?? request()->attributes->get('canvas_content_locale', ContentLocales::resolve());
        }

        return route($name, $parameters);
    }
}
