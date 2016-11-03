<!DOCTYPE html>
<html lang="en">
    <head>
        @include('shared.meta-tags')
        @yield('title')
        <meta name="description" content="{{ $meta_description }}">
        @include('frontend.partials.frontend-css')
    </head>
    <body>
        <div id="app">
            @include('frontend.partials.header')
            @yield('content')
            @include('frontend.partials.footer')
        </div>
        @include('frontend.partials.frontend-js')
        @yield('unique-js')
        <script type="text/javascript" src="{{elixir('/assets/js/app-vue.js')}}"></script>
    </body>
</html>
