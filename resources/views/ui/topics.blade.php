@extends('canvas::ui.layout')

@section('title', 'Topics — ' . config('app.name'))

@section('content')
    <header class="mb-10">
        <h1 class="text-3xl font-bold">Topics</h1>
    </header>

    <div class="space-y-3">
        @forelse ($topics as $topic)
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <a href="{{ route('canvas-ui.topic', $topic->slug) }}"
                   class="font-medium text-gray-800 hover:underline">
                    {{ $topic->name }}
                </a>
                <span class="text-sm text-gray-400">
                    {{ $topic->posts_count }} {{ str('post')->plural($topic->posts_count) }}
                </span>
            </div>
        @empty
            <p class="text-gray-500 text-center py-16">No topics yet.</p>
        @endforelse
    </div>

    <div class="mt-8">
        {{ $topics->links('canvas::ui.partials.pagination') }}
    </div>

    <div class="mt-8">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection