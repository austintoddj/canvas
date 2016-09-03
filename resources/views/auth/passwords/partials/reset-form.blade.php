<form role="form" id="forgot-password" method="POST" action="{{ route('auth.password.reset.store') }}">
    {!! csrf_field() !!}

    @if(session()->has('status'))
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    @endif

    <input type="hidden" name="token" value="{{ $token }}">

    <div class="form-group fg-line">
        <input type="email" class="form-control"
               name="email" value="{{ $email or old('email') }}" placeholder="Email">
    </div>

    <div class="form-group fg-line">
        <input type="password" name="password" class="form-control"
               placeholder="Password">
    </div>

    <div class="form-group fg-line">
        <input type="password" name="password_confirmation" class="form-control"
               placeholder="Confirm Password">
    </div>

    <button type="submit" name="submit" class="btn btn-primary btn-block m-t-10">Reset my password</button>
</form>
