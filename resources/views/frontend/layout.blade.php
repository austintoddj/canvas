<!DOCTYPE html>
<html lang="en">
    <head>
        @include('shared.meta-tags')

        @yield('title')

        <meta name="description" content="{{ $meta_description }}">

        @include('frontend.partials.css')
    </head>
    <body>
        @include('frontend.blog.partials.header')

        @yield('content')

        @yield('unique-js')

        @include('frontend.blog.partials.footer')

        @if(config('blog.tracking_id', false))
            @include('frontend.blog.partials.tracking')
        @endif

    </body>
</html>