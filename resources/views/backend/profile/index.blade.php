@extends('backend.profile.layout')

@section('profile-content')
    @parent
    @if(isset($data['bio']) && !empty($data['bio']))
        <div class="pmb-block">
            <div class="pmbb-header">
                <h2><i class="zmdi zmdi-equalizer m-r-10"></i> Summary</h2>
            </div>
            <div class="pmbb-body p-l-30">
                <div class="pmbb-view">
                    {{ $data['bio'] }}
                </div>
            </div>
        </div>
    @endif

    <div class="pmb-block">
        <div class="pmbb-header">
            <h2><i class="zmdi zmdi-account m-r-10"></i> Basic Information</h2>
        </div>
        <div class="pmbb-body p-l-30">
            <div class="pmbb-view">
                <dl class="dl-horizontal">
                    <dt>Full Name</dt>
                    <dd>{{ $data['first_name'] . ' ' . $data['last_name']}}</dd>
                </dl>
                @if(isset($data['gender']) && !empty($data['gender']))
                    <dl class="dl-horizontal">
                        <dt>Gender</dt>
                        <dd>{{ $data['gender'] }}</dd>
                    </dl>
                @endif
                @if(isset($data['birthday']) && !empty($data['birthday']))
                    <dl class="dl-horizontal">
                        <dt>Birthday</dt>
                        <dd>{{ \Carbon\Carbon::createFromFormat('Y-m-d', $data['birthday'])->format('M d, Y') }}</dd>
                    </dl>
                @endif
                @if(isset($data['relationship']) && !empty($data['relationship']) )
                    <dl class="dl-horizontal">
                        <dt>Relationship Status</dt>
                        <dd>{{ $data['relationship'] }}</dd>
                    </dl>
                @endif
            </div>
        </div>
    </div>

    <div class="pmb-block">
        <div class="pmbb-header">
            <h2><i class="zmdi zmdi-phone m-r-10"></i> Contact Information</h2>
        </div>
        <div class="pmbb-body p-l-30">
            <div class="pmbb-view">
                @if(isset($data['phone']) && strlen($data['phone']))
                    <dl class="dl-horizontal">
                        <dt>Mobile Phone</dt>
                        <dd>{{ $data['phone'] }}</dd>
                    </dl>
                @endif
                <dl class="dl-horizontal">
                    <dt>Email Address</dt>
                    <dd>{{ $data['email'] }}</dd>
                </dl>
                @if(isset($data['address']) && !empty($data['address']))
                    <dl class="dl-horizontal">
                        <dt>Address</dt>
                        <dd>{{ $data['address'] }}</dd>
                    </dl>
                @endif
                @if(isset($data['city']) && !empty($data['city']))
                    <dl class="dl-horizontal">
                        <dt>City</dt>
                        <dd>{{ $data['city'] }}</dd>
                    </dl>
                @endif
                @if(isset($data['country']) && !empty($data['country']))
                    <dl class="dl-horizontal">
                        <dt>Country</dt>
                        <dd>{{ $data['country'] }}</dd>
                    </dl>
                @endif
            </div>
        </div>
    </div>

    @if(isset($data['twitter']) && strlen($data['twitter']) || isset($data['facebook']) && strlen($data['facebook']) || isset($data['github']) && strlen($data['github']) || isset($data['linkedin']) && strlen($data['linkedin']) || isset($data['resume_cv']) && strlen($data['resume_cv']))
        <div class="pmb-block">
            <div class="pmbb-header">
                <h2><i class="zmdi zmdi-accounts m-r-10"></i> Social Networks</h2>
            </div>
            <div class="pmbb-body p-l-30">
                <div class="pmbb-view">
                    @if(isset($data['twitter']) && strlen($data['twitter']))
                        <dl class="dl-horizontal">
                            <dt>Twitter</dt>
                            <dd><a href="http://twitter.com/{{ $data['twitter'] }}" target="_blank">{{ '@' . $data['twitter'] }}</a></dd>
                        </dl>
                    @endif
                    @if(isset($data['facebook']) && strlen($data['facebook']))
                        <dl class="dl-horizontal">
                            <dt>Facebook</dt>
                            <dd><a href="http://facebook.com/{{ $data['facebook'] }}" target="_blank">{{ $data['facebook'] }}</a></dd>
                        </dl>
                    @endif
                    @if(isset($data['github']) && strlen($data['github']))
                        <dl class="dl-horizontal">
                            <dt>GitHub</dt>
                            <dd><a href="http://github.com/{{ $data['github'] }}" target="_blank">{{ $data['github'] }}</a></dd>
                        </dl>
                    @endif
                    @if(isset($data['linkedin']) && strlen($data['linkedin']))
                        <dl class="dl-horizontal">
                            <dt>LinkedIn</dt>
                            <dd><a href="http://linkedin.com/in/{{ $data['linkedin'] }}" target="_blank">{{ $data['linkedin'] }}</a></dd>
                        </dl>
                    @endif
                    @if(isset($data['resume_cv']) && strlen($data['resume_cv']))
                        <dl class="dl-horizontal">
                            <dt>Resume/CV</dt>
                            <dd><a href="{{ url('uploads', $data['resume_cv']) }}" target="_blank">{{ $data['resume_cv'] }}</a></dd>
                        </dl>
                    @endif
                </div>
            </div>
        </div>
    @endif
@stop