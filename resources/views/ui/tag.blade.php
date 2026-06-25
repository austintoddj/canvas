@extends('canvas::ui.layout')

@section('title', $tag->name . ' — ' . config('app.name'))

@section('content')
    <header class="mb-10">
        <p class="text-sm text-gray-500 mb-1">Tag</p>
        <h1 class="text-3xl font-bold">{{ $tag->name }}</h1>
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
            </article>
        @empty
            <p class="text-gray-500 text-center py-16">No posts in this tag yet.</p>
        @endforelse
    </div>

    <div class="mt-8">{{ $posts->links() }}</div>

    <div class="mt-8">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection
