<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    class="h-full bg-gray-900"
    @if(\Canvas\Canvas::usingRightToLeftLanguage($scripts['user']['locale'])) dir="rtl" @endif
>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name') }} ― Canvas</title>

    <link rel="icon" type="image/x-icon" href="{{ mix('img/favicon.png', 'vendor/canvas') }}" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap">
    <link rel="stylesheet" type="text/css" href="{{ mix('css/app.css', 'vendor/canvas') }}">

    @if(\Canvas\Canvas::enabledDarkMode($scripts['user']['dark_mode']))
        <link rel="stylesheet" href="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/sunburst.min.css">
    @else
        <link rel="stylesheet" href="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/github.min.css">
    @endif

    <script src="//cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/highlight.min.js"></script>
</head>
<body class="h-full">

<div id="app"></div>

<script type="text/javascript">
    window.Canvas = @json($scripts);
</script>

<script type="text/javascript" src="{{ mix('js/app.js', 'vendor/canvas') }}"></script>
</body>
</html>
