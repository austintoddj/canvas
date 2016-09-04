<form role="form" id="login" method="POST" action="{{ route('auth.login.store') }}">
    {!! csrf_field() !!}
    <div class="form-group fg-line">
        <input type="email" class="form-control"
               name="email" value="{{ old('email') }}" placeholder="Email">
    </div>
    <div class="form-group fg-line">
        <input type="password" name="password" class="form-control"
               placeholder="Password">
    </div>

    <div class="form-group fg-line">
        <div class="checkbox">
            <label>
                <input type="checkbox" name="remember">
                <i class="input-helper"></i>
                Remember me
            </label>
        </div>
    </div>

    <button type="submit" name="submit" class="btn btn-primary btn-block m-t-10">Sign in</button>
    <hr>
    <a href="{{ route('auth.password.forgot') }}" class="btn btn-link btn-block m-t-10">Forgot my password</a>
</form>
