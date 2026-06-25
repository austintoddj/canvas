@extends('canvas::ui.layout')

@section('title', $topic->name . ' — ' . config('app.name'))

@section('content')
    <header class="mb-10">
        <p class="text-sm text-gray-500 mb-1">Topic</p>
        <h1 class="text-3xl font-bold">{{ $topic->name }}</h1>
    </header>

    <div class="space-y-8">
        @forelse ($posts as $post)
            <article class="border-b border-gray-100 pb-8 last:border-0">
                <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <time datetime="{{ $post->published_at->toDateString() }}">
                        {{ $post->published_at->format('M j, Y') }}
                    </time>
                    <span>&middot;</span>
                    <span>{{ $post->read_time }}</span>
                </div>
                <h2 class="text-xl font-bold mb-1">
                    <a href="{{ route('canvas-ui.show', $post->slug) }}" class="hover:underline">
                        {{ $post->title }}
                    </a>
                </h2>
                @if ($post->summary)
                    <p class="text-gray-600 text-sm leading-relaxed">{{ $post->summary }}</p>
                @endif
                @if ($post->tags->isNotEmpty())
                    <div class="flex flex-wrap gap-1 mt-2">
                        @foreach ($post->tags as $tag)
                            <a href="{{ route('canvas-ui.tag', $tag->slug) }}"
                               class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                                {{ $tag->name }}
                            </a>
                        @endforeach
                    </div>
                @endif
            </article>
        @empty
            <p class="text-gray-500 text-center py-16">No posts in this topic yet.</p>
        @endforelse
    </div>

    <div class="mt-8">{{ $posts->links() }}</div>

    <div class="mt-8">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection
