@component('mail::message')
# {{ __('canvas::app.your_weekly_writer_summary_for') }} {{ $data['end_date'] }}

{{ __('canvas::app.from') }} {{ $data['start_date'] }} {{ __('canvas::app.to') }} {{ $data['end_date'] }} {{ __('canvas::app.your_posts_received') }}

@component('mail::table')
|                                 |                                  |
|---------------------------------|----------------------------------|
| **+{{ $data['total_views'] }}** | **+{{ $data['total_visits'] }}** |
| {{ __('canvas::app.views') }}   | {{ __('canvas::app.visits') }}   |
@endcomponent

@component('mail::table')
|                        | {{ __('canvas::app.visits') }}            | {{ __('canvas::app.views') }}            |
| ---------------------- | ----------------------------------------- | ----------------------------------------:|
@foreach($data['posts'] as $post)
| *{{ $post['title'] }}* | **+{{ number_format($post['visits']) }}** | **+{{ number_format($post['views']) }}** |
@endforeach
@endcomponent

@component('mail::button', ['url' => url(config('canvas.path'))])
{{ __('canvas::app.see_all_stats') }}
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
