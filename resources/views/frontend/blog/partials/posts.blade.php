@foreach ($posts as $post)
    <div class="post-preview">
        @if ($post->page_image)
            <div class="text-center img-featured @foreach($post->tags as $tag) img-{{str_replace(' ', '-', $tag->tag)}} @endforeach" id="img-{{$post->id}}">
                <img src="{{ asset($post->page_image) }}" class="post-hero">
            </div>
        @endif
        <h2 class="post-title">
            <a href="{{ $post->url($tag) }}">{{ $post->title }}</a>
        </h2>
        <p class="post-meta">
            {{ $post->published_at->diffForHumans() }}
            @unless ($post->tags->isEmpty())
                in {!! implode(', ', $post->tagLinks()) !!}
            @endunless
            &#183; {{ $post->readingTime() }} MIN READ
        </p>
        <p id="postSubtitle">
            {{ str_limit($post->subtitle, config('blog.frontend_trim_width')) }}
        </p>
        <p style="font-size: 13px"><a href="{{ $post->url($tag) }}">READ MORE...</a></p>
    </div>
    <hr>
@endforeach
