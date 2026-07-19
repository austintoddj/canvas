@extends('canvas::ui.layout')

@section('title', config('app.name'))

@push('head')
    @include('canvas::ui.partials.meta', [
        'title' => config('app.name'),
        'description' => 'Posts from '.config('app.name').'.',
        'url' => route('canvas-ui.index'),
        'type' => 'website',
    ])
@endpush

@section('content')
    <div class="space-y-10">
        @forelse ($posts as $post)
            <article class="border-b border-gray-100 pb-10 last:border-0">
                @if ($post->featured_image)
                    <a href="{{ route('canvas-ui.show', $post->slug) }}">
                        <img src="{{ $post->featured_image }}"
                             alt="{{ $post->featured_image_caption ?? $post->title }}"
                             class="w-full h-56 object-cover rounded-lg mb-4"
                             loading="lazy"
                             decoding="async">
                    </a>
                @endif

                <div class="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    @if ($post->topic)
                        <a href="{{ route('canvas-ui.topic', $post->topic->slug) }}"
                           class="font-medium text-indigo-600 hover:underline">
                            {{ $post->topic->name }}
                        </a>
                        <span>&middot;</span>
                    @endif
                    <time datetime="{{ $post->published_at->toDateString() }}">
                        {{ $post->published_at->format('M j, Y') }}
                    </time>
                    <span>&middot;</span>
                    <span>{{ $post->read_time }}</span>
                </div>

                <h2 class="text-2xl font-bold mb-2 leading-snug">
                    <a href="{{ route('canvas-ui.show', $post->slug) }}" class="hover:underline">
                        {{ $post->title }}
                    </a>
                </h2>

                @if ($post->summary)
                    <p class="text-gray-600 leading-relaxed mb-3">{{ $post->summary }}</p>
                @endif

                @if ($post->user)
                    @include('canvas::ui.partials.author', ['user' => $post->user])
                @endif
            </article>
        @empty
            <p class="text-gray-500 text-center py-16">No posts published yet.</p>
        @endforelse
    </div>

    <div class="mt-10">
        {{ $posts->links('canvas::ui.partials.pagination') }}
    </div>
@endsection
