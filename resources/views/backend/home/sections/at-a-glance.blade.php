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
                @if($data['disqus'] === 1)
                    <i class="zmdi zmdi-disqus"></i> <a href="{{ url('https://github.com/austintoddj/canvas#advanced-options') }}" target="_blank"><span class="label label-success">Disqus: {{ strtoupper('Enabled') }}</span></a>
                @else
                    <i class="zmdi zmdi-disqus"></i> <a href="{{ url('https://github.com/austintoddj/canvas#advanced-options') }}" target="_blank"><span class="label label-danger">Disqus: {{ strtoupper('Disabled') }}</span></a>
                @endif
            </li>
            <li>
                @if($data['analytics'] === 1)
                    <i class="zmdi zmdi-trending-up"></i> <a href="{{ url('https://github.com/austintoddj/canvas#advanced-options') }}" target="_blank"><span class="label label-success">Google Analytics: {{ strtoupper('Enabled') }}</span></a>
                @else
                    <i class="zmdi zmdi-trending-up"></i> <a href="{{ url('https://github.com/austintoddj/canvas#advanced-options') }}" target="_blank"><span class="label label-danger">Google Analytics: {{ strtoupper('Disabled') }}</span></a>
                @endif
            </li>
        </ul>
        <hr>
        <small>Canvas v2.1.3 is currently running <a href="https://laravel.com/docs/5.2" target="_blank">Laravel 5.3</a>.</small>
    </div>
</div>