@extends('backend.layout')

@section('title')
    <title>{{ config('blog.title') }} | Uploads</title>
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
                            <li class="active">Uploads</li>
                        </ol>
                        <ul class="actions">
                            <li class="dropdown">
                                <a href="" data-toggle="dropdown">
                                    <i class="zmdi zmdi-more-vert"></i>
                                </a>

                                <ul class="dropdown-menu dropdown-menu-right">
                                    <li>
                                        <a href="">Refresh Uploads</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>

                        @include('shared.errors')
                        @include('shared.success')

                        <h2>Uploads&nbsp;
                            <a href="" data-toggle="modal" data-target="#modal-file-upload"><i class="zmdi zmdi-file-plus" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Upload file(s)"></i></a>
                            &nbsp;
                            <a href="" data-toggle="modal" data-target="#modal-folder-create"><i class="zmdi zmdi-folder" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="New folder"></i></a>

                            <small>This page provides a comprehensive overview of your media library. Click the <span class="zmdi zmdi-search text-primary"></span> icon next to each file to preview it or click the <span class="zmdi zmdi-delete text-primary"></span> icon to remove it from the library.</small>
                        </h2>

                        <br>

                        <ul class="breadcrumb folder-paths">
                            @foreach ($breadcrumbs as $path => $disp)
                                <li><a href="{{ url('admin/upload?folder=' . $path) }}">{{ $disp }}</a></li>
                            @endforeach
                            <li class="active">{{ $folderName }}</li>
                        </ul>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-condensed table-vmiddle">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @if(empty($files) && empty($subfolders))
                                    <tr><td>Folder <em>{{ $folderName }}</em> is empty.</td></tr>
                                @else
                                    @include('backend.upload.partials.folders-row')
                                    @include('backend.upload.partials.files-row')
                                @endif
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    </section>
    @include('backend.upload.partials.modals.folders.create')
    @include('backend.upload.partials.modals.folders.delete')
    @include('backend.upload.partials.modals.files.preview')
    @include('backend.upload.partials.modals.files.create')
    @include('backend.upload.partials.modals.files.delete')
@stop

@section('unique-js')
    <script type="text/javascript">
        function delete_file(name) {
            $("#delete-file-name1").html(name);
            $("#delete-file-name2").val(name);
            $("#modal-file-delete").modal("show");
        }

        function delete_folder(name) {
            $("#delete-folder-name1").html(name);
            $("#delete-folder-name2").val(name);
            $("#modal-folder-delete").modal("show");
        }

        function preview_image(path) {
            $("#preview-image").attr("src", path);
            $("#path").html(path);
            $("#modal-image-view").modal("show");
        }
    </script>
    {!! JsValidator::formRequest('App\Http\Requests\UploadNewFolderRequest', '#folderCreate'); !!}
    {!! JsValidator::formRequest('App\Http\Requests\UploadFileRequest', '#fileCreate'); !!}

    @if(Session::get('_new-folder'))
        @include('backend.partials.notify', ['section' => '_new-folder'])
        {{ \Session::forget('_new-folder') }}
    @endif

    @if(Session::get('_delete-folder'))
        @include('backend.partials.notify', ['section' => '_delete-folder'])
        {{ \Session::forget('_delete-folder') }}
    @endif

    @if(Session::get('_new-file'))
        @include('backend.partials.notify', ['section' => '_new-file'])
        {{ \Session::forget('_new-file') }}
    @endif

    @if(Session::get('_delete-file'))
        @include('backend.partials.notify', ['section' => '_delete-file'])
        {{ \Session::forget('_delete-file') }}
    @endif
@stop
