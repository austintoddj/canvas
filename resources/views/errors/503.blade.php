@extends('errors.layout')

@section('title')
    <title>Canvas | Be right back</title>
@stop

@section('login')
    <section id="main">
        <section id="content">
            <div class="col-lg-4 col-lg-offset-4 col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3 col-xs-12">
                <div class="card">
                    <br>
                    <div class="card-header" style="text-align: center">
                        <img src="{{ asset('assets/images/favicon.png') }}" style="width: 85px">
                    </div>

                    <div class="card-body card-padding" id="login-ch">
                        <p class="f-20 f-300 text-center">503 - Be right back</p>
                        <p class="text-muted text-center">We're currently in Maintenance mode. Why don't you check back shortly?</p>
                    </div>
                </div>
            </div>
        </section>
    </section>
@stop


