@extends('canvas::auth')

@section('content')
    <main class="col-12 col-lg-5">
        <div class="mb-5 text-center">
            <h1>Please <span class="font-cursive">sign in</span></h1>
        </div>
        <div class="card shadow-lg w-auto">
            <div class="card-body">
                <form method="POST" action="{{ route('canvas.login') }}" class="w-100 my-auto">
                    @csrf

                    <div class="form-group row">
                        <div class="col-12">
                            <label for="email" class="font-weight-bold text-uppercase text-muted small"> Email </label>
                            <input
                                type="email"
                                name="email"
                                value="{{ old('email') }}"
                                id="email"
                                class="form-control border-0 @error('email') is-invalid @enderror"
                                placeholder="Email address"
                                required
                                autofocus
                            />
                            @error('email')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                            @enderror
                        </div>
                    </div>

                    <div class="form-group row">
                        <div class="col-12">
                            <label for="password" class="font-weight-bold text-uppercase text-muted small"> Password </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                class="form-control border-0 @error('password') is-invalid @enderror"
                                placeholder="Password"
                                required
                            />
                            @error('password')
                            <span class="invalid-feedback" role="alert">
                                <strong>{{ $message }}</strong>
                            </span>
                            @enderror
                        </div>
                    </div>

                    <div class="form-group row">
                        <div class="col-12">
                            <button class="btn btn-success btn-block mt-3" type="submit">Sign in</button>
                        </div>
                    </div>
                </form>

                <div class="d-flex justify-content-center mt-3">
                    <a class="btn btn-link text-decoration-none" href="{{ route('canvas.password.request') }}"> Forgot your password? </a>
                </div>
            </div>
        </div>
        @if(config('canvas.credit.display', true))
        <div class="mt-5 text-center">
            <p class="text-muted">Powered by <a href="{{config('canvas.credit.uri', 'https://trycanvas.app')}}" class="text-primary text-decoration-none">{{config('canvas.credit.name', 'Canvas')}}</a></p>
        </div>
        @endif
    </main>
@endsection
