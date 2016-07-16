@extends('frontend.layout')

@section('title')
    <title>{{ $tag->title or config('blog.title') }}</title>
@stop

@section('content')
    <div class="container">
        <div class="row">
            <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
                @if (isset($tag->title))
                    <p class="tag-link">Explore <a href="#">{{ $tag->title or '' }}</a></p>
                    <p class="tag-subtitle">- {{ $tag->subtitle }} -</p>
                @endif

                {{-- Empty Search --}}
                @if(sizeof($posts) == 0 && strlen(trim(\Input::get('search', ''))) != 0)
                    <div class="row">
                        <div class="col-md-12 text-center">
                            <h2>No Search Results</h2>
                        </div>
                    </div>

                @endif

                {{-- The Posts --}}
                @foreach ($posts as $post)
                    <div class="post-preview">
                        <h2 class="post-title">
                            <a href="{{ $post->url($tag) }}">{{ $post->title }}</a>
                        </h2>
                        <p class="post-meta">
                            {{ $post->published_at->diffForHumans() }}
                            @unless ($post->tags->isEmpty())
                                in {!! implode(', ', $post->tagLinks()) !!}
                            @endunless
                        </p>
                    </div>
                    <hr>
                @endforeach
                {{-- The Pager --}}
                <ul class="pager">
                    {{-- Reverse direction --}}
                    @if ($reverse_direction)
                        @if ($posts->currentPage() > 1)
                            <li class="previous">
                                <a href="{!! $posts->url($posts->currentPage() - 1) !!}">
                                    <i class="fa fa-angle-left fa-lg"></i>
                                    Previous {{ $tag->tag }}
                                </a>
                            </li>
                        @endif
                        @if ($posts->hasMorePages())
                            <li class="next">
                                <a href="{!! $posts->nextPageUrl() !!}">
                                    Next {{ $tag->tag }}
                                    <i class="fa fa-angle-right"></i>
                                </a>
                            </li>
                        @endif
                    @else
                        @if ($posts->currentPage() > 1)
                            <li class="previous">
                                <a href="{!! $posts->url($posts->currentPage() - 1) !!}">
                                    <i class="fa fa-angle-left fa-lg"></i>
                                    Newer {{ $tag ? $tag->tag : '' }}
                                </a>
                            </li>
                        @endif
                        @if ($posts->hasMorePages())
                            <li class="next">
                                <a href="{!! $posts->nextPageUrl() !!}">
                                    Older {{ $tag ? $tag->tag : '' }}
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