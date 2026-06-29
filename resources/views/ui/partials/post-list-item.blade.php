<article class="border-b border-gray-100 pb-8 last:border-0">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
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
    <h2 class="text-xl font-bold mb-1">
        <a href="{{ route('canvas-ui.show', $post->slug) }}" class="hover:underline">
            {{ $post->title }}
        </a>
    </h2>
    @if ($post->summary)
        <p class="text-gray-600 text-sm leading-relaxed">{{ $post->summary }}</p>
    @endif
    @if ($showAuthor ?? false)
        @if ($post->user)
            <div class="mt-2">
                @include('canvas::ui.partials.author', ['user' => $post->user])
            </div>
        @endif
    @endif
    @if ($showTags ?? false)
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
    @endif
</article>