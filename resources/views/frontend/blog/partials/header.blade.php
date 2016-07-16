<div class="container">
    <div class="row">
        <div class="col-md-2 col-md-offset-10">
            <div class="form-group">
                <form method="get">
                    <input type="text" name="search" value="{{Request::get('search')}}" class="form-control"
                           placeholder="Search..."
                           style="margin-top: 15px";
                    />
                </form>
            </div>
        </div>
    </div>
</div>

<div class="container" id="head-c">
    <div class="row">
        <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
            <h1><a href="{{url('/')}}">{{ config('blog.title') }}</a></h1>

            @if(isset($user->twitter) && strlen($user->twitter))
                <a href="http://twitter.com/{{ $user->twitter }}" target="_blank" id="social"><i class="fa fa-fw fa-twitter"></i></a>
            @endif
            @if(isset($user->facebook) && strlen($user->facebook))
                <a href="http://facebook.com/{{ $user->facebook }}" target="_blank" id="social"><i class="fa fa-fw fa-facebook"></i></a>
            @endif
            @if(isset($user->github) && strlen($user->github))
                <a href="http://github.com/{{ $user->github }}" target="_blank" id="social"><i class="fa fa-fw fa-github"></i></a>
            @endif
        </div>
    </div>
</div>
