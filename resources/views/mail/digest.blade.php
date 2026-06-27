@component('mail::message')

# {{ trans('canvas::app.your_weekly_writer_summary_for', [], $locale) }} {{ $endDate }}

{{ trans('canvas::app.from', [], $locale) }} {{ $startDate }} {{ trans('canvas::app.to', [], $locale) }} {{ $endDate }} {{ trans('canvas::app.your_posts_received', [], $locale) }}

# {{ trans('canvas::app.views', [], $locale) }}
## +{{ $totals['views'] }}

# {{ trans('canvas::app.visits', [], $locale) }}
## +{{ $totals['visits'] }}

@component('mail::table')
|                                                                   | {{ trans('canvas::app.visits', [], $locale) }}       | {{ trans('canvas::app.views', [], $locale) }} |
| ----------------------------------------------------------------- | --------------------------------------------------------: | --------------------------------------------------:|
@foreach($posts as $post)
| *{{ \Illuminate\Support\Str::limit($post['title'], 40, '...') }}* | **+{{ number_format($post['visits_count']) }}**           | **+{{ number_format($post['views_count']) }}**     |
@endforeach
@endcomponent

@component('mail::button', ['url' => url(config('canvas.path'))])
{{ trans('canvas::app.see_all_stats', [], $locale) }}
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
