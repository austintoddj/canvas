@extends('frontend.layout', [
  'title' => $post->title,
  'meta_description' => $post->meta_description ?: config('blog.description'),
])

@section('og-title')
    <meta property="og:title" content="{{ $post->title }}"/>
@stop

@if ($post->page_image)
    @section('og-image')
        <meta property="og:image" content="{{ url('/uploads/' . $post->page_image) }}">
    @stop
@endif

@section('og-description')
    <meta property="og:description" content="{{ $post->meta_description }}"/>
@stop

@section('title')
    <title>{{ $title or config('blog.title') }}</title>
@stop

@section('unique-js')
    <script src="{{ asset('js/frontend.js') }}" charset="utf-8"></script>
@endsection

@section('content')
    <article>
        <div class="container" id="post">
            <div class="row">
                <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
                    @if ($post->page_image)
                        <div class="text-center">
                            <img src="{{ asset('uploads/' . $post->page_image) }}" class="post-hero">
                        </div>
                    @endif
                    <p class="post-page-meta">
                        {{ \Carbon\Carbon::parse($post->published_at)->toFormattedDateString() }}
                        @if ($post->tags->count())
                            in
                            {!! join(', ', $post->tagLinks()) !!}
                        @endif
                    </p>
                    <h1 class="post-page-title">{{ $post->title }}</h1>
                    <hr>
                    {!! $post->content_html !!}

                    @include('frontend.blog.partials.author')

                </div>
            </div>
        </div>
    </article>

    <div class="container">
        <div class="row">
            <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
                <ul class="pager">
                    @if ($tag && $tag->reverse_direction)
                        @if ($post->olderPost($tag))
                            <li class="previous">
                                <a href="{!! $post->olderPost($tag)->url($tag) !!}">
                                    <i class="fa fa-angle-left fa-lg"></i>
                                    Previous {{ $tag->tag }}
                                </a>
                            </li>
                        @endif
                        @if ($post->newerPost($tag))
                            <li class="next">
                                <a href="{!! $post->newerPost($tag)->url($tag) !!}">
                                    Next {{ $tag->tag }}
                                    <i class="fa fa-angle-right"></i>
                                </a>
                            </li>
                        @endif
                    @else
                        @if ($post->newerPost($tag))
                            <li class="previous">
                                <a href="{!! $post->newerPost($tag)->url($tag) !!}">
                                    <i class="fa fa-angle-left fa-lg"></i>
                                    Newer
                                </a>
                            </li>
                        @endif
                        @if ($post->olderPost($tag))
                            <li class="next">
                                <a href="{!! $post->olderPost($tag)->url($tag) !!}">
                                    Older
                                    <i class="fa fa-angle-right"></i>
                                </a>
                            </li>
                        @endif
                    @endif
                </ul>
            </div>
        </div>
    </div>
@stop
