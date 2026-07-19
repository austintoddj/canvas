@extends('canvas::ui.layout')

@php
    $seo = \Canvas\Support\PostSeo::resolve($post, route('canvas-ui.show', $post->slug));
    $pageTitle = $seo['title'].' — '.config('app.name');
    $jsonLd = [
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => $seo['title'],
        'description' => $seo['description'],
        'mainEntityOfPage' => $seo['canonical_url'],
        'datePublished' => $post->published_at?->toAtomString(),
        'dateModified' => $post->updated_at?->toAtomString(),
    ];
    if (filled($seo['image_url'])) {
        $jsonLd['image'] = [$seo['image_url']];
    }
    if ($post->user) {
        $jsonLd['author'] = [
            '@type' => 'Person',
            'name' => $post->user->name,
        ];
    }
@endphp

@section('title', $pageTitle)

@push('head')
    @include('canvas::ui.partials.meta', [
        'title' => $seo['title'],
        'description' => $seo['description'],
        'url' => $seo['canonical_url'],
        'type' => 'article',
        'image' => $seo['image_url'],
        'imageAlt' => $seo['image_alt'],
        'publishedTime' => $post->published_at?->toAtomString(),
        'modifiedTime' => $post->updated_at?->toAtomString(),
        'jsonLd' => $jsonLd,
    ])
@endpush

@section('content')
    <article>
        <header class="mb-8">
            @if ($post->topic)
                <a href="{{ route('canvas-ui.topic', $post->topic->slug) }}"
                   class="text-sm font-medium text-indigo-600 hover:underline">
                    {{ $post->topic->name }}
                </a>
            @endif

            <h1 class="text-4xl font-bold mt-2 mb-4 leading-tight">{{ $post->title }}</h1>

            @if ($post->summary)
                <p class="text-xl text-gray-500 leading-relaxed mb-4">{{ $post->summary }}</p>
            @endif

            <div class="flex items-center gap-3 text-sm text-gray-500">
                @if ($post->user)
                    @include('canvas::ui.partials.author', [
                        'user' => $post->user,
                        'size' => 40,
                        'imageClass' => 'w-8 h-8',
                        'linkClass' => 'font-medium text-gray-700',
                    ])
                    <span>&middot;</span>
                @endif
                <time datetime="{{ $post->published_at->toDateString() }}">
                    {{ $post->published_at->format('M j, Y') }}
                </time>
                <span>&middot;</span>
                <span>{{ $post->read_time }}</span>
            </div>
        </header>

        @if ($post->featured_image)
            <figure class="mb-8">
                <img src="{{ $post->featured_image }}"
                     alt="{{ $post->featured_image_caption ?? $post->title }}"
                     class="w-full rounded-lg"
                     decoding="async">
                @if ($post->featured_image_caption)
                    <figcaption class="text-sm text-center text-gray-400 mt-2">
                        {{ $post->featured_image_caption }}
                    </figcaption>
                @endif
            </figure>
        @endif

        <div class="prose prose-lg max-w-none font-serif text-gray-800 prose-headings:font-sans prose-a:text-indigo-600 hover:prose-a:text-indigo-800">
            {!! $post->body !!}
        </div>

        @if ($post->tags->isNotEmpty())
            <footer class="mt-10 pt-6 border-t border-gray-100">
                <div class="flex flex-wrap gap-2">
                    @foreach ($post->tags as $tag)
                        <a href="{{ route('canvas-ui.tag', $tag->slug) }}"
                           class="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                            {{ $tag->name }}
                        </a>
                    @endforeach
                </div>
            </footer>
        @endif
    </article>

    <div class="mt-12">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection
