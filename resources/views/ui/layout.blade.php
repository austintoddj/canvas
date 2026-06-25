<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', config('app.name'))</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Inter:wght@400;500;600&display=swap">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .prose-content { font-family: 'Merriweather', serif; }
    </style>
    @stack('head')
</head>
<body class="bg-white text-gray-900 antialiased">
    <header class="border-b border-gray-100 py-4 mb-8">
        <div class="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <a href="{{ route('canvas-ui.index') }}" class="font-semibold text-lg tracking-tight">
                {{ config('app.name') }}
            </a>
        </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 pb-16">
        @yield('content')
    </main>

    <footer class="border-t border-gray-100 py-6 mt-8">
        <div class="max-w-3xl mx-auto px-4 text-center text-sm text-gray-400">
            Powered by <a href="https://trycanvas.app" class="hover:underline">Canvas</a>
        </div>
    </footer>
</body>
</html>
