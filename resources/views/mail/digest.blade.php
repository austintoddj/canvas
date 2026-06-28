<x-mail::message>

# {{ __('canvas::app.hello') }}, {{ $userName }}

{{ __('canvas::app.your_weekly_writer_summary_for') }} **{{ $startDate }}** – **{{ $endDate }}**.

<x-mail::panel>
**+{{ number_format($totals['views']) }}** {{ __('canvas::app.views') }} &nbsp;·&nbsp; **+{{ number_format($totals['visits']) }}** {{ __('canvas::app.visits') }}
</x-mail::panel>

---

@forelse($posts as $post)
**[{{ $post['title'] }}]({{ url(config('canvas.path').'/posts/'.$post['id'].'/stats') }})**

@if(!empty($post['summary']))
{{ \Illuminate\Support\Str::limit($post['summary'], 140) }}

@endif
+{{ number_format($post['views_count']) }} {{ __('canvas::app.views') }} &nbsp;·&nbsp; +{{ number_format($post['visits_count']) }} {{ __('canvas::app.visits') }} &nbsp;·&nbsp; {{ $post['read_time'] }}

---

@empty
_{{ __('canvas::app.your_posts_received') }} 0 {{ __('canvas::app.views') }} {{ __('canvas::app.this_week') }}._

---

@endforelse

<x-mail::button :url="url(config('canvas.path').'/stats')">
{{ __('canvas::app.see_all_stats') }}
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
