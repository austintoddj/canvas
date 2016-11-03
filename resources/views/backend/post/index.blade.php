@extends('backend.layout')

@section('title')
    <title>{{ Settings::blogTitle() }} | Posts</title>
@stop

@section('content')
    <section id="main">
        @include('backend.partials.sidebar-navigation')
        <section id="content">
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <ol class="breadcrumb">
                            <li><a href="{{ url('admin') }}">Home</a></li>
                            <li class="active">Posts</li>
                        </ol>
                        @include('shared.errors')
                        @include('shared.success')
                        <h2>Posts&nbsp;
                            <a href="{{ url('admin/post/create') }}"><i class="zmdi zmdi-plus-circle" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Create a new post"></i></a>

                            <small>This page provides a comprehensive overview of all your blog posts. Click the <span class="zmdi zmdi-edit text-primary"></span> icon next to each post to update its contents or the <span class="zmdi zmdi-search text-primary"></span> icon to see what it looks like to your readers.</small>
                        </h2>
                    </div>

                    <div class="table-responsive">
                        <table id="posts" class="table table-condensed table-vmiddle">
                            <thead>
                                <tr>
                                    <th data-column-id="id" data-type="numeric" data-order="desc">ID</th>
                                    <th data-column-id="title">Title</th>
                                    <th data-column-id="slug">Slug</th>
                                    <th data-column-id="published">Status</th>
                                    <th data-column-id="date" data-type="date" data-formatter="humandate">Date</th>
                                    <th data-column-id="commands" data-formatter="commands" data-sortable="false">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($data as $post)
                                    <tr>
                                        <td>{{ $post->id }}</td>
                                        <td>{{ $post->title }}</td>
                                        <td>{{ $post->slug }}</td>
                                        <td>{{ $post->is_draft == 1 ? '<span class="label label-primary">Draft</span>' : '<span class="label label-success">Published</span>' }}</td>
                                        @if($post->updated_at != $post->created_at)
                                            <td>{{ $post->updated_at->format('Y/m/d') . "<br/>" }} Last updated</td>
                                        @else
                                            <td>{{ $post->created_at->format('Y/m/d') . "<br/>" }} Published</td>
                                        @endif
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    </section>
@stop

@section('unique-js')
    @if(Session::get('_delete-post'))
        @include('backend.partials.notify', ['section' => '_delete-post'])
        {{ \Session::forget('_delete-post') }}
    @endif
    @if(Session::get('_update-post'))
        @include('backend.partials.notify', ['section' => '_update-post'])
        {{ \Session::forget('_update-post') }}
    @endif
    @include('backend.post.partials.datatable')
@stop
