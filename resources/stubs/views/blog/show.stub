@extends('blog.layouts.app')

@section('title', $data['post']->title)

@push('meta')
    <meta name="description" content="{{ $data['meta']['description'] ?? '' }}">
    <meta name="og:title" content="{{ $data['meta']['title'] ?? '' }}">
    <meta name="og:description" content="{{ $data['meta']['description'] ?? '' }}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $data['meta']['title'] ?? '' }}">
    <meta name="twitter:description" content="{{ $data['meta']['description'] ?? '' }}">

    @isset($data['meta']['canonical_link'])
        <link rel="canonical" href="{{ $data['meta']['canonical_link'] }}"/>
    @endisset

    @isset($data['post']->featured_image)
        <meta name="og:image" content="{{ url($data['post']->featured_image) }}">
        <meta name="twitter:image" content="{{ url($data['post']->featured_image) }}">
    @endisset
@endpush

@section('actions')
    @if($data['post']->user_id == optional(request()->user())->id)
        <div class="dropdown">
            <a href="#" aria-label="Settings" class="nav-link px-3" role="button" data-toggle="dropdown"
               aria-haspopup="true" aria-expanded="false" v-pre>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" viewBox="0 0 24 24" class="icon-cog"><path class="primary" d="M6.8 3.45c.87-.52 1.82-.92 2.83-1.17a2.5 2.5 0 0 0 4.74 0c1.01.25 1.96.65 2.82 1.17a2.5 2.5 0 0 0 3.36 3.36c.52.86.92 1.8 1.17 2.82a2.5 2.5 0 0 0 0 4.74c-.25 1.01-.65 1.96-1.17 2.82a2.5 2.5 0 0 0-3.36 3.36c-.86.52-1.8.92-2.82 1.17a2.5 2.5 0 0 0-4.74 0c-1.01-.25-1.96-.65-2.82-1.17a2.5 2.5 0 0 0-3.36-3.36 9.94 9.94 0 0 1-1.17-2.82 2.5 2.5 0 0 0 0-4.74c.25-1.01.65-1.96 1.17-2.82a2.5 2.5 0 0 0 3.36-3.36zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><circle cx="12" cy="12" r="2" class="primary"/></svg>
            </a>
            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
                <a href="{{ url(sprintf('%s/posts/%s/edit', config('canvas.path'), $data['post']->id)) }}"
                   class="dropdown-item">{{ __('canvas::blog.buttons.edit') }}</a>

                <a href="{{ url(sprintf('%s/stats/%s', config('canvas.path'), $data['post']->id)) }}"
                   class="dropdown-item">{{ __('canvas::blog.buttons.stats') }}</a>
            </div>
        </div>
    @endif
@endsection

@section('content')
    <div class="container">
        @include('blog.partials.navbar')

        <div class="row justify-content-md-center">
            <div class="col col-lg-8">
                <h1 class="text-dark font-serif pt-5 mb-4 @unless($data['post']->summary) mb-4 @endif">{{ $data['post']->title }}</h1>

                <div class="media py-1">
                    <img src="{{ sprintf('%s%s%s', 'https://secure.gravatar.com/avatar/', md5(strtolower(trim($data['author']->email))), '?s=200') }}"
                         class="mr-3 rounded-circle shadow-sm"
                         style="width: 50px"
                         alt="{{ $data['author']->name }}">
                    <div class="media-body">
                        <p class="mt-0 mb-1 font-weight-bold">{{ $data['author']->name }}</p>
                        <span class="text-muted">{{ \Carbon\Carbon::parse($data['post']->published_at)->formatLocalized('%b %d') }} — {{ $data['post']->read_time }}</span>
                    </div>
                </div>

                @isset($data['post']->featured_image)
                    <img src="{{ $data['post']->featured_image }}" class="w-100 pt-4"
                         @isset($data['post']->featured_image_caption) alt="{{ $data['post']->featured_image_caption }}"
                         title="{{ $data['post']->featured_image_caption }}" @endisset>
                    @isset($data['post']->featured_image_caption)
                        <p class="text-muted text-center pt-3" style="font-size: 0.9rem">{!! $data['post']->featured_image_caption !!}</p>
                    @endisset
                @endisset

                <div class="post font-serif mt-4">{!! $data['post']->body !!}</div>

                @if($data['post']->tags->count() > 0)
                    <h5>
                        @foreach($data['post']->tags as $tag)
                            <span><a href="{{ route('blog.tag', $tag->slug) }}" class="badge badge-light p-2 text-decoration-none">{{ $tag->name }}</a></span>
                        @endforeach
                    </h5>
                @endif
            </div>
        </div>
    </div>

    @isset(parse_url($data['meta']['canonical_link'])['host'])
        <div class="post">
            <hr>

            <p class="text-center font-italic pt-3 my-5">
                {{ __('canvas::blog.buttons.canonical') }} <a href="{{ url($data['meta']['canonical_link']) }}" target="_blank" class="text-dark" rel="noopener">{{ parse_url($data['meta']['canonical_link'])['host'] }}</a>
            </p>
        </div>
    @endisset

    <div class="read-more mt-5 container-fluid">
        <div class="row">
            @isset($data['next'])
                <div class="col-lg bg-light text-center px-lg-5 py-5"
                     @isset($data['next']->featured_image) style="background: linear-gradient(rgba(0, 0, 0, 0.8),rgba(0, 0, 0, 0.8)),url({{ $data['next']->featured_image }}); background-size: cover" @endisset>
                    <a href="{{ route('blog.post', $data['next']->slug) }}"
                       class="btn btn-sm text-decoration-none @isset($data['next']->featured_image) btn-outline-light @else btn-outline-secondary @endisset text-uppercase font-weight-bold mt-3">
                        {{ __('canvas::blog.buttons.next') }}
                    </a>
                    <h2 class="font-weight-bold font-serif my-3">
                        <a href="{{ route('blog.post', $data['next']->slug) }}" class="text-decoration-none @isset($data['next']->featured_image) text-light @else text-dark @endisset">{{ $data['next']->title }}</a>
                    </h2>
                    <p class="text-lg font-serif @isset($data['next']->featured_image) text-white-50 @else text-muted @endisset">{{ Illuminate\Support\Str::limit(strip_tags($data['next']->summary), 140) }}</p>
                </div>
            @endisset
            @isset($data['random'])
                <div class="col-lg bg-light text-center px-lg-5 py-5"
                     @isset($data['random']->featured_image) style="background: linear-gradient(rgba(0, 0, 0, 0.8),rgba(0, 0, 0, 0.8)),url({{ $data['random']->featured_image }}); background-size: cover" @endisset>
                    <a href="{{ route('blog.post', $data['random']->slug) }}" class="btn btn-sm text-decoration-none @isset($data['random']->featured_image) btn-outline-light @else btn-outline-secondary @endisset text-uppercase font-weight-bold mt-3">
                        {{ __('canvas::blog.buttons.enjoy') }}
                    </a>
                    <h2 class="font-weight-bold font-serif my-3 @isset($data['random']->featured_image) text-white @endisset">
                        <a href="{{ route('blog.post', $data['random']->slug) }}" class="text-decoration-none @isset($data['random']->featured_image) text-white @else text-dark @endisset">{{ $data['random']->title }}</a>
                    </h2>
                    <p class="font-serif body @isset($data['random']->featured_image) text-white-50 @else text-muted @endisset">{{ Illuminate\Support\Str::limit(strip_tags($data['random']->summary), 140) }}</p>
                </div>
            @endisset
        </div>
    </div>
@endsection

@push('scripts')
    <script type="text/javascript">
        $(function () {
            mediumZoom('.embedded_image img');
        });

        document.addEventListener('DOMContentLoaded', (event) => {
            document.querySelectorAll('pre').forEach((block) => {
                hljs.highlightBlock(block);
            });
        });
    </script>
@endpush
