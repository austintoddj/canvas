<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name') }} ― Canvas</title>

    @if($scripts['darkMode'])
        <link rel="stylesheet" id="baseStylesheet" type="text/css" href="{{ mix('css/app-dark.css', 'vendor/canvas') }}">
        <link rel="stylesheet" id="highlightStylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/sunburst.min.css">
    @else
        <link rel="stylesheet" id="baseStylesheet" type="text/css" href="{{ mix('css/app.css', 'vendor/canvas') }}">
        <link rel="stylesheet" id="highlightStylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/github.min.css">
    @endif

    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js"></script>
    <script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

    <link rel="shortcut icon" href="{{ mix('favicon.ico', 'vendor/canvas') }}">
</head>
<body>
<div id="canvas">
    @if(!$assetsUpToDate)
       <div class="alert alert-danger border-0 text-center rounded-0">
           {{ __('canvas::app.assets_are_not_up_to_date') }}
           {{ __('canvas::app.to_update_run') }}<br/><code>php artisan canvas:publish</code>
       </div>
    @endif

    <router-view></router-view>
</div>

<script>
    window.Canvas = @json($scripts);
</script>

<script type="text/javascript" src="{{ mix('js/app.js', 'vendor/canvas') }}"></script>
</body>
</html>
