<div class="card">
    <div class="card-header">
        <h2>At a Glance
            <small>Quick snapshot of your site:</small>
        </h2>
        <br>
        <ul class="getting-started">
            <li>
                <i class="zmdi zmdi-collection-bookmark"></i> <a href="{{ url('admin/post') }}">{{ count($data['posts']) }}{{ str_plural(' Post', count($data['posts'])) }}</a>
            </li>
            <li>
                <i class="zmdi zmdi-labels"></i> <a href="{{ url('admin/tag') }}">{{ count($data['tags']) }}{{ str_plural(' Tag', count($data['tags'])) }}</a>
            </li>
            <li>
                @if($data['status'] === 1)
                    <i class="zmdi zmdi-globe-alt"></i> <a href="{{ url('admin/tools') }}"><span class="label label-success">Status: {{ strtoupper('Active') }}</span></a>
                @else
                    <i class="zmdi zmdi-globe-alt"></i> <a href="{{ url('admin/tools') }}"><span class="label label-warning">Status: {{ strtoupper('Maintenance Mode') }}</span></a>
                @endif
            </li>
            <li>
                @if(isset($data['disqus']) && strlen($data['disqus']))
                    <i class="zmdi zmdi-disqus"></i> <a href="{{ url('admin/settings') }}"><span class="label label-success">Disqus: {{ strtoupper('Enabled') }}</span></a>
                @else
                    <i class="zmdi zmdi-disqus"></i> <a href="{{ url('admin/settings') }}"><span class="label label-danger">Disqus: {{ strtoupper('Disabled') }}</span></a>
                @endif
            </li>
            <li>
                @if(isset($data['analytics']) && strlen($data['analytics']))
                    <i class="zmdi zmdi-trending-up"></i> <a href="{{ url('admin/settings') }}"><span class="label label-success">Google Analytics: {{ strtoupper('Enabled') }}</span></a>
                @else
                    <i class="zmdi zmdi-trending-up"></i> <a href="{{ url('admin/settings') }}"><span class="label label-danger">Google Analytics: {{ strtoupper('Disabled') }}</span></a>
                @endif
            </li>
        </ul>
        
        $ch = curl_init('https://api.github.com/repos/austintoddj/canvas/releases/latest');
        curl_setopt($ch,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'); // Set a user agent
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        curl_close($ch);
        $obj = json_decode($result);
        
        @if($data['canvasVersion'] !== $obj->tag_name)
            <hr>
            <a href="{{ url('https://github.com/austintoddj/canvas/releases/tag/v2.1.7') }}" target="_blank"><small>Canvas <span id="tag_name"></span></a> is available! <a href="https://github.com/austintoddj/canvas/UPGRADE.md">Please update now.</a></small>
        @endif
    </div>
</div>
