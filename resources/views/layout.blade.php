<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name') }} ― Canvas</title>

    @php
        $manifest = json_decode(file_get_contents(public_path('vendor/canvas/.vite/manifest.json')), true);
        $entry = $manifest['resources/js/app.tsx'];
    @endphp

    <link rel="preconnect" href="https://rsms.me/">
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css">

    @foreach($entry['css'] ?? [] as $css)
        <link rel="stylesheet" href="{{ asset('vendor/canvas/' . $css) }}">
    @endforeach
</head>
<body>

@if(!\Canvas\Support\Assets::isUpToDate())
    <div class="alert alert-danger border-0 text-center rounded-0 mb-0">
        {{ trans('canvas::app.assets_are_not_up_to_date') }}
        {{ trans('canvas::app.to_update_run') }}<br/><code>php artisan canvas:publish</code>
    </div>
@endif

<div id="canvas"></div>

<script>
    window.Canvas = @json($jsVars);
</script>
<script type="module" src="{{ asset('vendor/canvas/' . $entry['file']) }}"></script>
</body>
</html>
