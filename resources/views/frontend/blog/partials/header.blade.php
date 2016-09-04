<div class="container" id="head-c">
    <div class="row">
        <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
            <h1><a href="{{ url('/') }}">{{ config('blog.title') }}</a></h1>

            @if(isset($user->twitter) && strlen($user->twitter))
                <a href="http://twitter.com/{{ $user->twitter }}" target="_blank" id="social"><i class="fa fa-fw fa-twitter"></i></a>
            @endif
            @if(isset($user->facebook) && strlen($user->facebook))
                <a href="http://facebook.com/{{ $user->facebook }}" target="_blank" id="social"><i class="fa fa-fw fa-facebook"></i></a>
            @endif
            @if(isset($user->github) && strlen($user->github))
                <a href="http://github.com/{{ $user->github }}" target="_blank" id="social"><i class="fa fa-fw fa-github"></i></a>
            @endif
            @if(isset($user->linkedin) && strlen($user->linkedin))
                <a href="http://linkedin.com/in/{{ $user->linkedin }}" target="_blank" id="social"><i class="fa fa-fw fa-linkedin"></i></a>
            @endif
            @if(isset($user->resume_cv) && strlen($user->resume_cv))
                @if(!empty($user->github) || !empty($user->twitter) || !empty($user->facebook) || !empty($user->linkedin))
                    <span id="social">&nbsp;-&nbsp;</span>
                @endif
                <a href="{{ url('uploads', $user->resume_cv) }}" target="_blank" id="social">
                    <i class="fa fa-fw fa-file-pdf-o"></i>
                    Resume/CV
                </a>
            @endif
        </div>
    </div>
</div>
