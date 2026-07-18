<!DOCTYPE html>
<html lang="{{ $htmlLang }}" dir="{{ $htmlDir }}" class="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Canvas</title>

    <link rel="icon" href="{{ asset('vendor/canvas/favicon.svg') }}" type="image/svg+xml">
    <link rel="icon" href="{{ asset('vendor/canvas/favicon-32x32.png') }}" type="image/png" sizes="32x32" media="(prefers-color-scheme: light)">
    <link rel="icon" href="{{ asset('vendor/canvas/favicon-16x16.png') }}" type="image/png" sizes="16x16" media="(prefers-color-scheme: light)">
    <link rel="icon" href="{{ asset('vendor/canvas/favicon-dark-32x32.png') }}" type="image/png" sizes="32x32" media="(prefers-color-scheme: dark)">
    <link rel="icon" href="{{ asset('vendor/canvas/favicon-dark-16x16.png') }}" type="image/png" sizes="16x16" media="(prefers-color-scheme: dark)">
    <link rel="apple-touch-icon" href="{{ asset('vendor/canvas/apple-touch-icon.png') }}">

    <link rel="preconnect" href="https://rsms.me/">
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css">

    <script>
        window.Canvas = @json($jsVars);
        // Apply saved theme before first render to avoid flash
        (function () {
            var t = localStorage.getItem('canvas-theme');
            var dark = t === 'dark' || (t !== 'light' && (t === 'system' || !t) && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', dark);
        })();
    </script>

    {!! \Canvas\Support\Vite::reactRefresh() !!}
    {!! \Canvas\Support\Vite::tags() !!}
</head>
<body>

@if(!\Canvas\Support\Assets::isUpToDate())
    <div class="alert alert-danger border-0 text-center rounded-0 mb-0">
        {{ trans('canvas::app.assets_are_not_up_to_date') }}
        {{ trans('canvas::app.to_update_run') }}<br/><code>php artisan canvas:publish</code>
    </div>
@endif

<div id="canvas"></div>
</body>
</html>