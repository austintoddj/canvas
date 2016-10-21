<author inline-template>
    <div class="author-info">
        <img class="img-responsive img-circle author-img"
             src="//www.gravatar.com/avatar/{{ md5($user->email) }}?d=identicon&s=150"
             style="float: left; width: 60px"
             title="{{ $user->first_name .  ' ' . $user->last_name }}"
             @click="show = true"
        >
        <div id="auth-name">
            <h4 @click="show = true">
                <a href="javascript:void(0);">
                    <strong>
                        {{ $user->first_name .  ' ' . $user->last_name }}
                    </strong>
                </a>
            </h4>

            <span class="small">
                {{ $user->bio }}
                <br>
                @if (!empty($user->twitter))
                    <a href="http://twitter.com/{{ $user->twitter }}" target="_blank" class="social"><i class="fa fa-fw fa-twitter text-muted"></i></a>
                @endif
                @if (!empty($user->facebook))
                    <a href="http://facebook.com/{{ $user->facebook }}" target="_blank" class="social"><i class="fa fa-fw fa-facebook text-muted"></i></a>
                @endif
                @if (!empty($user->github))
                    <a href="http://github.com/{{ $user->github }}" target="_blank" class="social"><i class="fa fa-fw fa-github text-muted"></i></a>
                @endif
                @if(!empty($user->linkedin))
                    <a href="http://linkedin.com/in/{{ $user->linkedin }}" target="_blank" class="social"><i class="fa fa-fw fa-linkedin text-muted"></i></a>
                @endif
            </span>
        </div>

        <modal class="modal-overlay"
               size="modal-sm"
               v-if="show"
               @close="show = false"
        >
            <div class="modal-header">
                <button class="close" type="button" @click="show = false">×</button>
                <h4 class="modal-title"> {{ $user->first_name }} {{ $user->last_name }} </h4>
            </div>

            <div class="modal-body">
                <img class="img-responsive img-circle center-block"
                     src="//www.gravatar.com/avatar/{{ md5($user->email) }}?d=identicon&s=350"
                     style="width: 55%"
                     title="{{ $user->first_name .  ' ' . $user->last_name }}"
                >
                <p>{{ $user->bio }}</p>
                <p>
                    <a href="mailto: {{ $user->email }}" target="_blank">{{ $user->email }}</a>
                </p>

            </div>

            <div class="modal-footer">
                <button class="btn btn-sm btn-default waves-effect" type="button" @click="show = false">
                    Close
                </button>
            </div>
        </modal>
    </div>

</author>


@section('unique-js')
    <script>
        Vue.component('author', {
            data: function () {
                return {
                    show: false
                }
            },

            methods: {
                close: function () {
                    this.$emit('close');
                },
            }

        });
    </script>
@stop