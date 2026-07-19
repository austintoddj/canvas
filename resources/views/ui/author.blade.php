@extends('canvas::ui.layout')

@php
    $canvasUser = $user->relationLoaded('canvasUser') ? $user->getRelation('canvasUser') : null;
    $avatarUrl = \Canvas\Support\AuthorAvatar::url($canvasUser?->avatar);
    $initials = collect(preg_split('/\s+/', trim((string) $user->name) ?: '') ?: [])
        ->filter()
        ->take(2)
        ->map(fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)))
        ->implode('');
    if ($initials === '') {
        $initials = '?';
    }
    $authorDescription = filled($canvasUser?->summary)
        ? $canvasUser->summary
        : 'Posts by '.$user->name.'.';
@endphp

@section('title', $user->name . ' — ' . config('app.name'))

@push('head')
    @include('canvas::ui.partials.meta', [
        'title' => $user->name,
        'description' => $authorDescription,
        'url' => route('canvas-ui.author', $canvasUser?->username ?? ''),
        'type' => 'website',
        'image' => $avatarUrl,
        'imageAlt' => $user->name,
    ])
@endpush

@section('content')
    <header class="mb-10 flex items-start gap-5">
        @if ($avatarUrl)
            <img src="{{ $avatarUrl }}"
                 alt="{{ $user->name }}"
                 class="w-20 h-20 rounded-full object-cover shrink-0"
                 loading="lazy"
                 decoding="async">
        @else
            <span class="inline-flex w-20 h-20 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xl font-medium shrink-0" aria-hidden="true">{{ $initials }}</span>
        @endif
        <div>
            <h1 class="text-3xl font-bold">{{ $user->name }}</h1>
            @if ($canvasUser?->username)
                <p class="text-gray-500 mt-1">{{ '@'.$canvasUser->username }}</p>
            @endif
            @if ($canvasUser?->summary)
                <p class="text-gray-600 mt-3 leading-relaxed">{{ $canvasUser->summary }}</p>
            @endif
            @if ($canvasUser?->website)
                <p class="mt-2">
                    <a href="{{ $canvasUser->website }}"
                       class="text-sm text-indigo-600 hover:underline"
                       rel="noopener noreferrer"
                       target="_blank">
                        {{ $canvasUser->website }}
                    </a>
                </p>
            @endif
            @include('canvas::ui.partials.social-links', ['canvasUser' => $canvasUser])
        </div>
    </header>

    <section>
        <h2 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-100">Recent posts</h2>

        <div class="space-y-8">
            @forelse ($posts as $post)
                @include('canvas::ui.partials.post-list-item', ['post' => $post])
            @empty
                <p class="text-gray-500 text-center py-16">No published posts yet.</p>
            @endforelse
        </div>

        <div class="mt-8">
            {{ $posts->links('canvas::ui.partials.pagination') }}
        </div>
    </section>

    <div class="mt-8">
        <a href="{{ route('canvas-ui.index') }}" class="text-sm text-gray-500 hover:text-gray-700">
            &larr; All posts
        </a>
    </div>
@endsection
