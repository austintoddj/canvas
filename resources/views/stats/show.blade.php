@extends('canvas::index')

@section('actions')
    <a href="{{ route('canvas.index') }}" class="btn btn-sm btn-outline-primary my-auto mx-3">
        See all stats
    </a>
@endsection

@section('content')
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-10">
                <h5 class="text-muted small text-uppercase font-weight-bold mt-2">
                    Published on {{ \Carbon\Carbon::parse($data['post']->published_at)->format('F d, Y') }}
                </h5>
                <h1 class="mb-4">{{ $data['post']->title }}</h1>

                <line-chart :views="{{ $data['views'] }}"></line-chart>
            </div>

            <div class="col-md-5 mt-4">
                <h5 class="text-muted small text-uppercase font-weight-bold">Views by Traffic Source</h5>

                @if($data['traffic'])
                    @foreach($data['traffic'] as $host => $views)
                        <div class="d-flex @if($loop->first) border-top @endif py-2 align-items-center">
                            <div class="mr-auto">
                                <p class="mb-0 py-1">
                                    @unless($host == 'Other')
                                        <img src="{{ sprintf('%s%s', 'https://favicons.githubusercontent.com/', $host) }}"
                                             alt="{{ $host }}" style="width: 15px; height: 15px;" class="mr-1">
                                        <a href="http://{{ $host }}" target="_blank">{{ $host }}</a>
                                    @else
                                        <img src="{{ sprintf('%s%s', 'https://favicons.githubusercontent.com/', $host) }}"
                                             alt="{{ $host }}" style="width: 15px; height: 15px;" class="mr-1">
                                        <a data-toggle="tooltip" data-placement="right"
                                                       style="cursor: pointer"
                                                       title="Post views in this category could not reliably determine a referrer. e.g. Incognito mode">
                                            {{ $host }} <i class="far fa-fw fa-question-circle text-muted"></i>
                                        </a>
                                    @endunless
                                </p>
                            </div>
                            <div class="ml-auto">
                                <span class="text-muted">{{ $canvasNumberFormatter->format($views) }} View(s)</span>
                            </div>
                        </div>
                    @endforeach
                @else
                    <p class="py-4 border-top"><em>Waiting until your post has more views to show these insights.</em>
                    </p>
                @endif
            </div>

            <div class="col-md-5 mt-4">
                <h5 class="text-muted small text-uppercase font-weight-bold">Popular Reading Times</h5>

                @if($data['popular_reading_times'])
                    @foreach($data['popular_reading_times'] as $range => $percentage)
                        <div class="d-flex py-2 @if($loop->first) border-top @endif align-items-center">
                            <div class="mr-auto">
                                <p class="mb-0 py-1">
                                    {{ $range }}
                                </p>
                            </div>
                            <div class="ml-auto">
                                <span class="text-muted">{{ sprintf('%s%%', $percentage) }}</span>
                            </div>
                        </div>
                    @endforeach
                @else
                    <p class="py-4 border-top"><em>Waiting until your post has more views to show these insights.</em>
                    </p>
                @endif
            </div>
        </div>
    </div>
@endsection
