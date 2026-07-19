@extends('canvas::ui.layout')

@section('title', $topic->name . ' — ' . config('app.name'))

@push('head')
    @include('canvas::ui.partials.meta', [
        'title' => $topic->name,
        'description' => 'Posts in '.$topic->name.'.',
        'url' => route('canvas-ui.topic', $topic->slug),
        'type' => 'website',
    ])
@endpush

@section('content')
    <header class="mb-10">
        <p class="text-sm text-gray-500 mb-1">Topic</p>
        <h1 class="text-3xl font-bold">{{ $topic->name }}</h1>
    </header>

    <div class="space-y-8">
        @forelse ($posts as $post)
            @include('canvas::ui.partials.post-list-item', ['post' => $post, 'showAuthor' => true, 'showTags' => true])
        @empty
            <p class="text-gray-500 text-center py-16">No posts in this topic yet.</p>
        @endforelse
    </div>

    <div class="mt-8">
        {{ $posts->links('canvas::ui.partials.pagination') }}
    </div>

    <div class="mt-8">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection
