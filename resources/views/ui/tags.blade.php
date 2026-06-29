@extends('canvas::ui.layout')

@section('title', 'Tags — ' . config('app.name'))

@section('content')
    <header class="mb-10">
        <h1 class="text-3xl font-bold">Tags</h1>
    </header>

    <div class="space-y-3">
        @forelse ($tags as $tag)
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <a href="{{ route('canvas-ui.tag', $tag->slug) }}"
                   class="font-medium text-gray-800 hover:underline">
                    {{ $tag->name }}
                </a>
                <span class="text-sm text-gray-400">
                    {{ $tag->posts_count }} {{ str('post')->plural($tag->posts_count) }}
                </span>
            </div>
        @empty
            <p class="text-gray-500 text-center py-16">No tags yet.</p>
        @endforelse
    </div>

    <div class="mt-8">
        {{ $tags->links('canvas::ui.partials.pagination') }}
    </div>

    <div class="mt-8">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection