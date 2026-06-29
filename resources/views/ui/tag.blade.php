@extends('canvas::ui.layout')

@section('title', $tag->name . ' — ' . config('app.name'))

@section('content')
    <header class="mb-10">
        <p class="text-sm text-gray-500 mb-1">Tag</p>
        <h1 class="text-3xl font-bold">{{ $tag->name }}</h1>
    </header>

    <div class="space-y-8">
        @forelse ($posts as $post)
            @include('canvas::ui.partials.post-list-item', ['post' => $post, 'showAuthor' => true])
        @empty
            <p class="text-gray-500 text-center py-16">No posts in this tag yet.</p>
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