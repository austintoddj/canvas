@extends('blog.layouts.app')

@section('title', sprintf('%s — %s', config('app.name'), __('canvas::blog.title')))

@section('content')
    <div class="container">
        @include('blog.partials.navbar')

        @if($data['topics'])
            <div class="nav-scroller py-1 mb-2">
                <nav class="nav d-flex justify-content-between">
                    @foreach($data['topics'] as $topic)
                        <a class="p-2 text-muted text-decoration-none" href="{{ route('blog.topic', $topic->slug) }}">{{ $topic->name }}</a>
                    @endforeach
                </nav>
            </div>
        @endif

        @if($data['posts']->count() > 0)
            @foreach($data['posts'] as $post)
                @if($loop->first)
                    <div class="jumbotron p-4 p-md-5 text-white rounded @if(empty($post->featured_image)) bg-dark @endif"
                         @if(!empty($post->featured_image)) style="background: linear-gradient(rgba(0, 0, 0, 0.85),rgba(0, 0, 0, 0.85)),url({{ $post->featured_image }}); background-size: cover" @endif>
                        <div class="col-md-8 px-0">
                            <h1 class="font-italic font-serif">
                                <a href="{{ route('blog.post', $post->slug) }}" class="text-white text-decoration-none">{{ $post->title }}</a>
                            </h1>
                            <p class="lead my-3">
                                <a href="{{ route('blog.post', $post->slug) }}" class="text-white text-decoration-none">{{ $post->summary }}</a>
                            </p>
                            <p class="lead mb-0">
                                <a href="{{ route('blog.post', $post->slug) }}" class="text-white font-weight-bold text-decoration-none">{{ __('canvas::blog.buttons.continue') }}</a>
                            </p>
                        </div>
                    </div>
                @endif
            @endforeach
        @endif
    </div>

    <main role="main" class="container @if($data['posts']->count() == 0) mt-4 @endif">
        <div class="row">
            <div class="col-md-8">
                <h3 class="mb-4 font-italic @if($data['posts']->count() > 0) pb-4 border-bottom @endif font-serif">
                    {{ __('canvas::blog.posts.label') }}
                </h3>
                @if($data['posts']->count() > 0)
                    @foreach($data['posts'] as $post)
                        @if(!$loop->first)
                            <div class="mb-5">
                                <h3>
                                    <a href="{{ route('blog.post', $post->slug) }}" class="font-serif text-dark text-decoration-none">{{ $post->title }}</a>
                                </h3>
                                <p class="text-muted mb-2">{{ $post->published_at->formatLocalized('%b %d') }} — {{ $post->read_time }}</p>
                                <p>
                                    <a href="{{ route('blog.post', $post->slug) }}" class="text-dark text-decoration-none">{{ $post->summary }}</a>
                                </p>
                            </div>
                        @endif
                    @endforeach

                    {{ $data['posts']->links() }}
                @else
                    <p class="mt-4">{{ __('canvas::blog.empty.description') }}
                        <a href="{{ url(sprintf('%s/posts/create', config('canvas.path'))) }}" class="text-success text-decoration-none">{{ __('canvas::blog.empty.action') }}</a>.
                    </p>
                @endif
            </div>

            @if($data['tags'])
                <aside class="col-md-4">
                    <div class="p-md-4">
                        <h4 class="font-italic font-serif">{{ __('canvas::blog.tags.label') }}</h4>
                        <ol class="list-unstyled mb-0">
                            @foreach($data['tags'] as $tag)
                                <li>
                                    <a href="{{ route('blog.tag', $tag->slug) }}" class="text-decoration-none text-secondary">{{ $tag->name }}</a>
                                </li>
                            @endforeach
                        </ol>
                    </div>
                </aside>
            @endif
        </div>
    </main>
@endsection
