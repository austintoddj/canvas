@if(!empty($user->github) || !empty($user->twitter) || !empty($user->facebook) || !empty($user->linkedin) || !empty($user->resume_cv))
    <div class="author">
        <img class="img-responsive img-circle author-img" src="//www.gravatar.com/avatar/{{ md5($user->email) }}?d=identicon&s=150">
        <h5><strong>{{ $user->first_name .  ' ' . $user->last_name }}</strong>
            <br>
            <br>
            <span class="text-muted author-bio">{{ $user->bio }}</span>
            <br>
            <br>
            @if (!empty($user->twitter))
                &nbsp;
                <a href="http://twitter.com/{{ $user->twitter }}" target="_blank"><i class="fa fa-fw fa-twitter author-social"></i></a>
            @endif
            @if (!empty($user->facebook))
                &nbsp;
                <a href="http://facebook.com/{{ $user->facebook }}" target="_blank"><i class="fa fa-fw fa-facebook author-social"></i></a>
            @endif
            @if (!empty($user->github))
                &nbsp;
                <a href="http://github.com/{{ $user->github }}" target="_blank"><i class="fa fa-fw fa-github author-social"></i></a>
            @endif
            @if(!empty($user->linkedin))
                &nbsp;
                <a href="http://linkedin.com/in/{{ $user->linkedin }}" target="_blank"><i class="fa fa-fw fa-linkedin author-social"></i></a>
            @endif
            @if(isset($user->resume_cv) && strlen($user->resume_cv))
                @if(!empty($user->github) || !empty($user->twitter) || !empty($user->facebook) || !empty($user->linkedin))
                    &nbsp;&nbsp;
                    <span class="author-social">
                        <a href="{{ url('uploads', $user->resume_cv) }}" class="author-social" target="_blank"><i class="fa fa-fw fa-download"></i> Resume/CV</a>
                    </span>
                @endif
            @endif
        </h5>
    </div>
@endif