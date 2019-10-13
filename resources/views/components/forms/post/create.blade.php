<form role="form" id="form-create" method="POST" action="{{ route('canvas.post.store') }}"
      enctype="multipart/form-data">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <input type="hidden" name="id" hidden value="{{ $data['id'] }}">

    <div class="form-group row my-3">
        <div class="col-lg-12">
            <title-input value="{{ old('title') }}" placeholder="{{  __('canvas::posts.forms.editor.title') }}" />
        </div>
    </div>

    <editor :unsplash="'{{ config('canvas.unsplash.access_key') }}'"
            :path="'{{ config('canvas.path') }}'">
    </editor>

    @include('canvas::components.modals.post.create.settings')
    @include('canvas::components.modals.post.create.publish')
    @include('canvas::components.modals.post.create.image')
    @include('canvas::components.modals.post.create.seo')
</form>
