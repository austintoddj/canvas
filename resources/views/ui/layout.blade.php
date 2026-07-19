<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', config('app.name'))</title>
    <link rel="alternate" type="application/rss+xml" title="{{ config('app.name') }}" href="{{ route('canvas-ui.feed') }}">
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        serif: ['Merriweather', 'serif'],
                    },
                },
            },
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Inter:wght@400;500;600&display=swap">
    <style>
        a:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }
    </style>
    @stack('head')
</head>
<body class="bg-white text-gray-900 antialiased font-sans">
    <header class="border-b border-gray-100 py-4 mb-8">
        <div class="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <a href="{{ route('canvas-ui.index') }}" class="font-semibold text-lg tracking-tight">
                {{ config('app.name') }}
            </a>
            <nav class="flex items-center gap-4 text-sm text-gray-500">
                <a href="{{ route('canvas-ui.tags') }}" class="hover:text-gray-700">Tags</a>
                <a href="{{ route('canvas-ui.topics') }}" class="hover:text-gray-700">Topics</a>
            </nav>
        </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 pb-16">
        @yield('content')
    </main>

    <footer class="border-t border-gray-100 py-6 mt-8">
        <div class="max-w-3xl mx-auto px-4 flex items-center justify-center gap-4 text-sm text-gray-400">
            <a href="{{ route('canvas-ui.feed') }}" class="hover:text-gray-600 hover:underline">RSS</a>
            <span aria-hidden="true">&middot;</span>
            <span>Powered by <a href="https://trycanvas.app" class="hover:underline">Canvas</a></span>
        </div>
    </footer>
</body>
</html>
