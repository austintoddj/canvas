@extends('canvas::index')

@section('actions')
    <a href="{{ route('canvas.post.create') }}" class="btn btn-sm btn-outline-primary my-auto mx-3">
        New post
    </a>
@endsection

@section('content')
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-10">
                <h1 class="mt-2">Stats</h1>

                @if($data['posts']['all']->isNotEmpty())
                    <p class="mt-3 mb-4">Click on a post below to see more detailed insights.</p>

                    <div class="card-deck mb-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title text-muted small text-uppercase font-weight-bold">Views (30 days)</h5>
                                <p class="card-text display-4">{{ $canvasNumberFormatter->format($data['views']['count']) }}</p>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title text-muted small text-uppercase font-weight-bold">Total Posts</h5>
                                <p class="card-text display-4">{{ $data['posts']['all']->count() }}</p>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title text-muted small text-uppercase font-weight-bold">Publishing</h5>
                                <ul>
                                    <li>{{ $data['posts']['published_count'] }} Published Post(s)</li>
                                    <li>{{ $data['posts']['drafts_count'] }} Draft(s)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <line-chart :views="{{ $data['views']['trend'] }}"></line-chart>

                    <post-list :models="{{ $data['posts']['all'] }}" inline-template>
                        <div class="mt-4">
                            <div v-cloak>
                                <div class="d-flex border-top py-3 align-items-center" v-for="post in filteredList">
                                    <div class="mr-auto">
                                        <p class="mb-1 mt-2">
                                            <a :href="'/canvas/stats/' + post.id" class="font-weight-bold lead">@{{ post.title }}</a>
                                        </p>
                                        <p class="text-muted mb-2">
                                            @{{ post.read_time }} ―
                                            <a :href="'/canvas/posts/' + post.id + '/edit'">Edit post</a> ―
                                            <a :href="'/canvas/stats/' + post.id">Details</a>
                                        </p>
                                    </div>
                                    <div class="ml-auto d-none d-lg-block">
                                        <span class="text-muted mr-3">@{{ suffixedNumber(post.views_count) }} View(s)</span>
                                        Created @{{ moment(post.created_at).fromNow() }}
                                    </div>
                                </div>

                                <div class="d-flex justify-content-center">
                                    <a href="#!" class="btn btn-link" @click="limit += 7" v-if="load">Show more <i class="fa fa-fw fa-angle-down"></i></a>
                                </div>
                            </div>
                        </div>
                    </post-list>
                @else
                    <p class="mt-4">There are no published posts for which you can view stats.</p>
                @endif
            </div>
        </div>
    </div>
@endsection
