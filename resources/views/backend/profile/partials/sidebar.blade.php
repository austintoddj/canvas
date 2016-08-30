<div class="pm-overview c-overflow">
    <div class="pmo-pic">
        <div class="p-relative">
            <a href="http://gravatar.com" target="_blank">
                <img class="img-responsive" src="//www.gravatar.com/avatar/{{ md5($data['email']) }}?d=identicon&s=500">
            </a>
            <div class="dropdown pmop-message">
                <a href="mailto:{{ $data['email'] }}" target="_blank" class="btn bgm-white btn-float z-depth-1">
                    <i class="zmdi zmdi-email"></i>
                </a>
            </div>
            <a href="http://gravatar.com" target="_blank" class="pmop-edit">
                <i class="zmdi zmdi-camera"></i> <span class="hidden-xs">Update Profile Picture</span>
            </a>
        </div>
        <div class="pmo-stat">
            <h2 class="m-0 c-white">{{ $data['first_name'] }}</h2>
            Member since {{ \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $data['created_at'])->format('M d, Y') }}
        </div>
    </div>
    <div class="pmo-block pmo-contact hidden-xs">
        <h2>Contact Information</h2>
        <ul>
            @if(isset($data['phone']) && strlen($data['phone']))
                <li><i class="zmdi zmdi-phone"></i> {{ $data['phone'] }}</li>
            @endif
            <li><i class="zmdi zmdi-email"></i> <a href="mailto:{{ $data['email'] }}" target="_blank">{{ $data['email'] }}</a></li>
            <li>
                @if(isset($data['address']) || isset($data['city']) || isset($data['country']))
                    <i class="zmdi zmdi-pin"></i>
                @endif
                <address class="m-b-0 ng-binding">
                    @if(isset($data['address']) && !empty($data['address']) )
                        {{ $data['address'] }},<br>
                    @endif
                    @if(isset($data['city']) && !empty($data['city']))
                        {{ $data['city'] }},<br>
                    @endif
                    @if(isset($data['country']) && !empty($data['country']))
                        {{ $data['country'] }}
                    @endif

                </address>
            </li>
        </ul>
    </div>

    @if(isset($data['twitter']) && strlen($data['twitter']) || isset($data['facebook']) && strlen($data['facebook']) || isset($data['github']) && strlen($data['github']) || isset($data['linkedin']) && strlen($data['linkedin']) || isset($data['resume_cv']) && strlen($data['resume_cv']))
        <div class="pmo-block pmo-contact hidden-xs">
            <h2>Social Networks</h2>
            <ul>
                @if(isset($data['twitter']) && strlen($data['twitter']))
                    <li><i class="zmdi zmdi-twitter-box"></i> <a href="http://twitter.com/{{ $data['twitter'] }}" target="_blank">{{'@'.$data['twitter'] }}</a></li>
                @endif
                @if(isset($data['facebook']) && strlen($data['facebook']))
                    <li><i class="zmdi zmdi-facebook-box"></i> <a href="http://facebook.com/{{ $data['facebook'] }}" target="_blank">{{ $data['facebook'] }}</a></li>
                @endif
                @if(isset($data['github']) && strlen($data['github']))
                    <li><i class="zmdi zmdi-github-box"></i> <a href="http://github.com/{{ $data['github'] }}" target="_blank">{{ $data['github'] }}</a></li>
                @endif
                @if(isset($data['linkedin']) && strlen($data['linkedin']))
                    <li><i class="zmdi zmdi-linkedin-box"></i> <a href="http://linkedin.com/in/{{ $data['linkedin'] }}" target="_blank">{{ $data['linkedin'] }}</a></li>
                @endif
                @if(isset($data['resume_cv']) && strlen($data['resume_cv']))
                    <li><i class="zmdi zmdi-collection-pdf"></i> <a href="{{ url('uploads', $data['resume_cv']) }}" target="_blank">{{ $data['resume_cv'] }}</a></li>
                @endif
            </ul>
        </div>
    @endif
</div>