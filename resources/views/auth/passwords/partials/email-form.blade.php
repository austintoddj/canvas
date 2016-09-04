<form role="form" id="forgot-password" method="POST" action="{{ route('auth.password.forgot.store') }}">
    {!! csrf_field() !!}

    @if(session()->has('status'))
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    @endif

    <div class="form-group fg-line">
        <input type="email" class="form-control"
               name="email" value="{{ old('email') }}" placeholder="Email">
    </div>

    <button type="submit" name="submit" class="btn btn-primary btn-block m-t-10">Send me a reset link</button>
    <hr>
    <a href="{{ url('admin') }}" class="btn btn-link btn-block m-t-10">Back To Sign In</a>
</form>
