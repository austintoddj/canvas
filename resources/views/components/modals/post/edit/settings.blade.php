<div class="modal fade" id="modal-settings" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-body">
                <p class="font-weight-bold lead">{{ __('canvas::posts.forms.settings.header') }}</p>

                <div class="form-group row">
                    <div class="col-12">
                        <label for="slug" class="font-weight-bold">{{ __('canvas::posts.forms.settings.slug.label') }}</label>
                        <slug-input placeholder="{{ __('canvas::posts.forms.settings.slug.placeholder') }}"
                                    name="slug"
                                    title="{{ __('canvas::posts.forms.settings.slug.label') }}"
                                    value="{{ old('slug', $data['post']->slug) }}"
                                    required
                        ></slug-input>
                        @if ($errors->has('slug'))
                            <div class="invalid-feedback d-block">
                                <strong>{{ $errors->first('slug') }}</strong>
                            </div>
                        @endif
                    </div>
                </div>
                <div class="form-group row">
                    <div class="col-12">
                        <label for="summary" class="font-weight-bold">{{ __('canvas::posts.forms.settings.summary.label') }}</label>
                        <textarea name="summary" class="form-control border-0 px-0"
                                  placeholder="{{ __('canvas::posts.forms.settings.summary.placeholder') }}" rows="1"
                                  title="{{ __('canvas::posts.forms.settings.summary.label') }}">{{ $data['post']->summary }}</textarea>
                    </div>
                </div>
                <div class="form-group row">
                    <div class="col-12">
                        <label for="topic" class="font-weight-bold">{{ __('canvas::posts.forms.settings.topic.label') }}</label>

                        <topic-select :topics="{{ $data['topics'] }}"
                                      :assigned="{{ json_encode(optional($data['post']->topic->first())->only(['name', 'slug'])) }}">
                        </topic-select>
                    </div>
                </div>
                <div class="form-group row">
                    <div class="col-12">
                        <label for="published_at" class="font-weight-bold">{{ __('canvas::posts.forms.settings.tags.label') }}</label>

                        <tag-select :tags="{{ $data['tags'] }}" :tagged="{{ $data['post']->tags }}"></tag-select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-link text-muted" data-dismiss="modal">{{ __('canvas::buttons.general.done') }}</button>
            </div>
        </div>
    </div>
</div>
